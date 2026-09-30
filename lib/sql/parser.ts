import { INPUT_TOO_BIG_MESSAGE, LIMITS, isOverInputLimit } from "../limits";
import { ErrorSink, snippetOf, tokenize } from "./tokenizer";
import type {
  IgnoredStatement,
  ParseResult,
  ParsedColumn,
  ParsedForeignKey,
  ParsedTable,
  Token,
} from "./types";

/**
 * Parser de CREATE TABLE (MySQL).
 *
 * Só CREATE TABLE. ALTER TABLE, views, triggers e outros dialetos ficam de fora e
 * aparecem em `ignored`. Erro de sintaxe nunca lança: vira item em `errors` e o
 * parser segue para a próxima definição. Tudo é iterativo (sem recursão nos parênteses).
 */

const OTHER_KNOWN_STATEMENTS = new Set([
  "alter", "drop", "insert", "update", "delete", "replace", "select", "set", "use", "lock",
  "unlock", "truncate", "rename", "grant", "revoke", "delimiter", "start", "begin", "commit",
  "rollback", "with", "call", "analyze", "optimize", "flush", "show", "describe", "desc", "explain",
  "load", "copy", "declare", "if", "while", "end", "comment", "source", "open", "close", "fetch", "loop", "leave",
]);

const OBJETOS_CREATE = new Set([
  "view", "trigger", "procedure", "function", "event", "index", "database", "schema", "user", "role", "sequence", "unique",
  "fulltext", "spatial", "definer", "server", "tablespace",
]);

const LONG_SECOND_WORDS = new Set(["varchar", "varbinary", "char", "character", "text", "blob"]);

const COMBINING_FIRST_WORDS = new Set(["alter", "drop", "create", "lock", "unlock", "truncate", "rename"]);

function lower(tok: Token | undefined): string {
  return tok && tok.kind === "word" ? tok.value.toLowerCase() : "";
}

function isPunct(tok: Token | undefined, value: string): boolean {
  return !!tok && tok.kind === "punct" && tok.value === value;
}

function isNameToken(tok: Token | undefined): tok is Token {
  return !!tok && (tok.kind === "word" || tok.kind === "backtick" || tok.kind === "dstring" || tok.kind === "string");
}

function emptyResult(): ParseResult {
  return { tables: [], errors: [], ignored: [], rejected: false, limitNotices: [] };
}

export function parseDdl(text: string): ParseResult {
  const result = emptyResult();

  if (isOverInputLimit(text)) {
    result.rejected = true;
    result.errors.push({ message: INPUT_TOO_BIG_MESSAGE, snippet: "", line: 0, col: 0 });
    return result;
  }

  const sink = new ErrorSink();
  const tokens = tokenize(text, sink);
  const notices = new Set<string>();
  const n = tokens.length;

  const nameOf = (tok: Token): string => {
    if (tok.value.length > LIMITS.maxIdentifierLength) {
      notices.add(
        `Um nome com mais de ${LIMITS.maxIdentifierLength} caracteres foi cortado (o MySQL aceita até 64).`,
      );
      return tok.value.slice(0, LIMITS.maxIdentifierLength);
    }
    return tok.value;
  };

  /** Índice logo depois do ")" que fecha o "(" em `open`, ou `limit` se não fechar. Iterativo. */
  const skipGroup = (open: number, limit: number): number => {
    let depth = 0;
    for (let k = open; k < limit; k++) {
      const t = tokens[k] as Token;
      if (t.kind !== "punct") continue;
      if (t.value === "(") depth++;
      else if (t.value === ")") {
        depth--;
        if (depth === 0) return k + 1;
      }
    }
    return limit;
  };

  /** Nomes (colunas) de um grupo "( a, `b`, c(10) )". Ignora tamanho de prefixo e ASC/DESC. */
  const namesInGroup = (open: number, limit: number): { names: string[]; next: number } => {
    const close = skipGroup(open, limit);
    const names: string[] = [];
    let depth = 0;
    let expectName = true;
    for (let k = open; k < close; k++) {
      const t = tokens[k] as Token;
      if (t.kind === "punct") {
        if (t.value === "(") {
          depth++;
          continue;
        }
        if (t.value === ")") {
          depth--;
          continue;
        }
        if (t.value === "," && depth === 1) expectName = true;
        continue;
      }
      if (depth === 1 && expectName && isNameToken(t)) {
        names.push(nameOf(t));
        expectName = false;
      }
    }
    return { names, next: close };
  };

  /** Lê "nome" ou "schema.nome". */
  const readQualifiedName = (k: number, limit: number): { name: string; schema: string | null; next: number } | null => {
    const first = tokens[k];
    if (k >= limit || !isNameToken(first)) return null;
    if (isPunct(tokens[k + 1], ".") && k + 2 < limit && isNameToken(tokens[k + 2])) {
      return { schema: nameOf(first), name: nameOf(tokens[k + 2] as Token), next: k + 3 };
    }
    return { schema: null, name: nameOf(first), next: k + 1 };
  };

  const errorAt = (idx: number, message: string): void => {
    const t = tokens[Math.min(idx, n - 1)];
    if (!t) return;
    sink.push({ message, snippet: snippetOf(text, t.start), line: t.line, col: t.col });
  };

  const isCreateTableAt = (k: number): boolean => {
    if (lower(tokens[k]) !== "create") return false;
    let j = k + 1;
    for (let guard = 0; guard < 4; guard++) {
      const w = lower(tokens[j]);
      if (w === "or" || w === "replace" || w === "temporary") j++;
      else break;
    }
    return lower(tokens[j]) === "table";
  };

  // ---------- definições dentro do corpo da tabela ----------

  const parseColumn = (a: number, b: number, table: ParsedTable): void => {
    const nameTok = tokens[a] as Token;
    const typeTok = tokens[a + 1];
    if (a + 1 >= b || !typeTok || typeTok.kind !== "word") {
      errorAt(a, `A coluna "${nameTok.value}" está sem tipo. Ela foi ignorada.`);
      return;
    }

    let j = a + 1;
    let baseType = typeTok.value.toLowerCase();
    j++;
    const second = lower(tokens[j]);
    if (
      j < b &&
      ((baseType === "double" && second === "precision") ||
        (baseType === "character" && second === "varying") ||
        ((baseType === "national" || baseType === "long") && LONG_SECOND_WORDS.has(second)))
    ) {
      baseType = `${baseType} ${second}`;
      j++;
    }
    let lastTypeTok = tokens[j - 1] as Token;

    let typeArgs: string | null = null;
    const enumValues: string[] = [];
    if (j < b && isPunct(tokens[j], "(")) {
      const close = skipGroup(j, b);
      const open = tokens[j] as Token;
      const closeTok = tokens[close - 1] as Token;
      typeArgs = isPunct(closeTok, ")") ? text.slice(open.end, closeTok.start).trim() : text.slice(open.end).trim();
      if (baseType === "enum" || baseType === "set") {
        for (let k = j + 1; k < close; k++) {
          const t = tokens[k] as Token;
          if (t.kind === "string" || t.kind === "dstring") enumValues.push(t.value);
        }
      }
      lastTypeTok = closeTok;
      j = close;
    }

    const column: ParsedColumn = {
      name: nameOf(nameTok),
      rawType: text.slice(typeTok.start, lastTypeTok.end).replace(/\s+/g, " "),
      baseType,
      typeArgs,
      enumValues,
      nullable: true,
      isPrimaryKey: false,
      autoIncrement: false,
      hasDefault: false,
      defaultRaw: null,
      unsigned: false,
      charset: null,
      collate: null,
      onUpdateRaw: null,
      comment: null,
      line: nameTok.line,
    };

    while (j < b) {
      const t = tokens[j] as Token;
      if (isPunct(t, "(")) {
        j = skipGroup(j, b);
        continue;
      }
      const w = lower(t);
      if (w === "not" && lower(tokens[j + 1]) === "null") {
        column.nullable = false;
        j += 2;
      } else if (w === "null") {
        column.nullable = true;
        j++;
      } else if (w === "default") {
        column.hasDefault = true;
        j++;
        const inicio = j;
        if (isPunct(tokens[j], "-") || isPunct(tokens[j], "+")) j++;
        if (j < b && isPunct(tokens[j], "(")) j = skipGroup(j, b);
        else if (j < b) {
          j++;
          if (j < b && isPunct(tokens[j], "(")) j = skipGroup(j, b);
        }
        if (j > inicio) column.defaultRaw = text.slice((tokens[inicio] as Token).start, (tokens[j - 1] as Token).end);
      } else if (w === "auto_increment") {
        column.autoIncrement = true;
        j++;
      } else if (w === "primary") {
        column.isPrimaryKey = true;
        j += lower(tokens[j + 1]) === "key" ? 2 : 1;
      } else if (w === "key") {
        column.isPrimaryKey = true;
        j++;
      } else if (w === "unique") {
        j += lower(tokens[j + 1]) === "key" ? 2 : 1;
      } else if (w === "comment") {
        const v = tokens[j + 1];
        if (j + 1 < b && v && (v.kind === "string" || v.kind === "dstring")) {
          column.comment = v.value;
          j += 2;
        } else {
          j++;
        }
      } else if (w === "references") {
        const ref = readQualifiedName(j + 1, b);
        if (ref) {
          let refColumns: string[] = [];
          let next = ref.next;
          if (isPunct(tokens[next], "(")) {
            const g = namesInGroup(next, b);
            refColumns = g.names;
            next = g.next;
          }
          table.foreignKeys.push({ columns: [column.name], refTable: ref.name, refColumns });
          j = next;
        } else {
          j++;
        }
      } else if (w === "unsigned") {
        column.unsigned = true;
        j++;
      } else if (w === "character" && lower(tokens[j + 1]) === "set") {
        column.charset = (tokens[j + 2] as Token | undefined)?.value.toLowerCase() ?? null;
        j += 3;
      } else if (w === "charset") {
        column.charset = (tokens[j + 1] as Token | undefined)?.value.toLowerCase() ?? null;
        j += 2;
      } else if (w === "collate") {
        column.collate = (tokens[j + 1] as Token | undefined)?.value.toLowerCase() ?? null;
        j += 2;
      } else if (w === "on" && lower(tokens[j + 1]) === "update") {
        const inicio = j + 2;
        j = inicio < b ? inicio + 1 : b;
        if (j < b && isPunct(tokens[j], "(")) j = skipGroup(j, b);
        if (inicio < b) column.onUpdateRaw = text.slice((tokens[inicio] as Token).start, (tokens[j - 1] as Token).end);
      } else if (w === "on") {
        j += 3; // ON DELETE ...
      } else {
        j++;
      }
    }

    if (table.columns.length >= LIMITS.maxColumnsPerTable) {
      notices.add(`A tabela "${table.name}" passa de ${LIMITS.maxColumnsPerTable} colunas; as colunas extras foram ignoradas.`);
      return;
    }
    table.columns.push(column);
  };

  const parseDefinition = (a: number, b: number, table: ParsedTable): void => {
    if (a >= b) return;
    const first = tokens[a] as Token;
    let k = a;
    let w = first.kind === "word" ? first.value.toLowerCase() : "";

    if (w === "constraint") {
      k++;
      const maybeName = tokens[k];
      const mw = lower(maybeName);
      if (k < b && isNameToken(maybeName) && !["primary", "unique", "foreign", "check"].includes(mw)) k++;
      w = lower(tokens[k]);
    }

    if (w === "primary" && lower(tokens[k + 1]) === "key") {
      let g = k + 2;
      while (g < b && !isPunct(tokens[g], "(")) g++;
      if (g < b) table.primaryKey = namesInGroup(g, b).names;
      return;
    }
    if (w === "foreign" && lower(tokens[k + 1]) === "key") {
      let g = k + 2;
      while (g < b && !isPunct(tokens[g], "(")) g++;
      if (g >= b) return;
      const cols = namesInGroup(g, b);
      let r = cols.next;
      while (r < b && lower(tokens[r]) !== "references") r++;
      if (r >= b) return;
      const ref = readQualifiedName(r + 1, b);
      if (!ref) return;
      let refColumns: string[] = [];
      if (isPunct(tokens[ref.next], "(")) refColumns = namesInGroup(ref.next, b).names;
      const fk: ParsedForeignKey = { columns: cols.names, refTable: ref.name, refColumns };
      table.foreignKeys.push(fk);
      return;
    }
    if (["unique", "key", "index", "fulltext", "spatial"].includes(w) && first.kind === "word") {
      // Índice: [UNIQUE|FULLTEXT|SPATIAL] [KEY|INDEX] [nome] (colunas)
      let p = k;
      let unique = false;
      let kind: "key" | "fulltext" | "spatial" = "key";
      if (lower(tokens[p]) === "unique") {
        unique = true;
        p++;
      } else if (lower(tokens[p]) === "fulltext" || lower(tokens[p]) === "spatial") {
        kind = lower(tokens[p]) as "fulltext" | "spatial";
        p++;
      }
      if (lower(tokens[p]) === "key" || lower(tokens[p]) === "index") p++;
      let nome: string | null = null;
      if (p < b && isNameToken(tokens[p]) && !isPunct(tokens[p], "(") && lower(tokens[p]) !== "using") {
        nome = nameOf(tokens[p] as Token);
        p++;
      }
      while (p < b && !isPunct(tokens[p], "(")) p++;
      if (p < b) table.indexes.push({ name: nome, unique, kind, columns: namesInGroup(p, b).names, line: first.line });
      return;
    }
    if (["check", "like", "period"].includes(w) && first.kind === "word") {
      return; // checks não mudam a classificação
    }
    if (w === "constraint") return;

    if (!isNameToken(first)) {
      errorAt(a, "Não entendi esta definição de coluna. Ela foi ignorada.");
      return;
    }
    parseColumn(a, b, table);
  };

  // ---------- CREATE TABLE ----------

  /** Devolve o índice onde o laço principal deve continuar. */
  const parseCreateTable = (createIdx: number, end: number): number => {
    let k = createIdx + 1;
    while (k < end && ["or", "replace", "temporary"].includes(lower(tokens[k]))) k++;
    k++; // "table"
    if (lower(tokens[k]) === "if" && lower(tokens[k + 1]) === "not" && lower(tokens[k + 2]) === "exists") k += 3;

    const qn = readQualifiedName(k, end);
    const startTok = tokens[createIdx] as Token;
    if (!qn) {
      errorAt(k, "Faltou o nome da tabela depois de CREATE TABLE.");
      return end;
    }
    k = qn.next;

    const w = lower(tokens[k]);
    if (w === "like" || w === "as" || w === "select") {
      result.ignored.push({ kind: `CREATE TABLE ${w.toUpperCase()}`, line: startTok.line });
      return end;
    }
    if (!isPunct(tokens[k], "(")) {
      errorAt(k >= end ? end - 1 : k, `Esperava "(" depois do nome da tabela "${qn.name}".`);
      return end;
    }

    if (result.tables.length >= LIMITS.maxTables) {
      notices.add(`Passou de ${LIMITS.maxTables} tabelas; as demais foram ignoradas.`);
      return end;
    }

    const table: ParsedTable = {
      name: qn.name,
      schema: qn.schema,
      columns: [],
      primaryKey: [],
      foreignKeys: [],
      indexes: [],
      options: { engine: null, charset: null, collate: null, autoIncrement: null },
      comment: null,
      line: startTok.line,
    };

    // Acha o ")" do corpo e as vírgulas de nível 1, em uma passagem.
    const open = k;
    let depth = 0;
    let close = -1;
    let resume = end;
    const commas: number[] = [];
    for (let m = open; m < end; m++) {
      const t = tokens[m] as Token;
      if (t.kind === "punct") {
        if (t.value === "(") depth++;
        else if (t.value === ")") {
          depth--;
          if (depth === 0) {
            close = m;
            break;
          }
        } else if (t.value === "," && depth === 1) commas.push(m);
      } else if (t.kind === "word" && depth >= 1 && isCreateTableAt(m)) {
        // Faltou ")" e ";" e já começa outra tabela.
        close = m;
        resume = m;
        break;
      }
    }
    const unclosed = close === -1 || resume !== end;
    if (close === -1) close = end;
    if (unclosed) errorAt(open, `A tabela "${qn.name}" não foi fechada com ")". Analisei o que deu.`);

    let segStart = open + 1;
    for (const comma of [...commas.filter((c) => c < close), close]) {
      if (comma > segStart) parseDefinition(segStart, comma, table);
      segStart = comma + 1;
    }

    // Opções depois do ")" (COMMENT da tabela). Para se outro CREATE TABLE começar sem ";".
    let next = unclosed ? resume : end;
    if (!unclosed) {
      for (let m = close + 1; m < end; m++) {
        if (lower(tokens[m]) === "create" && isCreateTableAt(m)) {
          next = m;
          break;
        }
        const w = lower(tokens[m]);
        if (w === "comment") {
          let v = m + 1;
          if (isPunct(tokens[v], "=")) v++;
          const s = tokens[v];
          if (v < end && s && (s.kind === "string" || s.kind === "dstring")) table.comment = s.value;
        } else if (w === "engine" || w === "charset" || w === "collate" || w === "auto_increment" || (w === "character" && lower(tokens[m + 1]) === "set")) {
          let v = m + (w === "character" ? 2 : 1);
          if (isPunct(tokens[v], "=")) v++;
          const valor = tokens[v];
          if (v < end && valor && valor.kind !== "punct") {
            const texto = valor.value;
            if (w === "engine") table.options.engine = texto;
            else if (w === "collate") table.options.collate = texto.toLowerCase();
            else if (w === "auto_increment") table.options.autoIncrement = texto;
            else table.options.charset = texto.toLowerCase();
          }
        }
      }
    }

    for (const col of table.columns) {
      if (table.primaryKey.includes(col.name)) col.isPrimaryKey = true;
    }
    result.tables.push(table);
    return next;
  };

  // ---------- laço principal: instrução por instrução ----------

  let i = 0;
  // Próximo ";" conhecido. Reaproveitado para a varredura não ficar quadrática
  // quando há muitas tabelas sem ";" entre elas.
  let semi = -1;
  while (i < n) {
    if (isPunct(tokens[i], ";")) {
      i++;
      continue;
    }
    // DELIMITER troca o terminador para poder escrever procedimentos e triggers (com ";" dentro).
    // Esses blocos ficam fora do escopo: pulamos tudo até o "DELIMITER ;" que restaura o normal.
    if (lower(tokens[i]) === "delimiter") {
      const head = tokens[i] as Token;
      let k = i + 1;
      while (k < n && (tokens[k] as Token).line === head.line) k++;
      const novo = tokens.slice(i + 1, k).map((t) => t.value).join("");
      i = k;
      if (novo !== ";" && novo !== "") {
        result.ignored.push({ kind: "DELIMITER (procedimento, função ou trigger)", line: head.line });
        while (i < n) {
          if (lower(tokens[i]) === "delimiter") {
            const l = (tokens[i] as Token).line;
            let m = i + 1;
            while (m < n && (tokens[m] as Token).line === l) m++;
            const valor = tokens.slice(i + 1, m).map((t) => t.value).join("");
            i = m;
            if (valor === ";") break;
          } else {
            i++;
          }
        }
      }
      continue;
    }
    if (semi < i) {
      semi = i;
      while (semi < n && !isPunct(tokens[semi], ";")) semi++;
    }
    const end = semi;

    const head = tokens[i] as Token;
    const w0 = lower(head);

    if (w0 === "create") {
      if (isCreateTableAt(i)) {
        const next = parseCreateTable(i, end);
        i = next > i ? next : end;
        continue;
      }
      // CREATE [OR REPLACE] [ALGORITHM=..] [DEFINER=..] [SQL SECURITY ..] VIEW|TRIGGER|PROCEDURE|FUNCTION|...
      let k = i + 1;
      while (k < end && k < i + 14 && !OBJETOS_CREATE.has(lower(tokens[k]))) k++;
      const what = OBJETOS_CREATE.has(lower(tokens[k])) ? lower(tokens[k]).toUpperCase() : "?";
      const ignored: IgnoredStatement = { kind: `CREATE ${what}`, line: head.line };
      result.ignored.push(ignored);
    } else if (w0 && OTHER_KNOWN_STATEMENTS.has(w0)) {
      const second = COMBINING_FIRST_WORDS.has(w0) ? lower(tokens[i + 1]).toUpperCase() : "";
      result.ignored.push({ kind: second ? `${w0.toUpperCase()} ${second}` : w0.toUpperCase(), line: head.line });
    } else {
      errorAt(i, "Isto não parece um CREATE TABLE nem outra instrução SQL conhecida. Foi ignorado.");
    }
    i = end;
  }

  result.errors = sink.finish();
  result.limitNotices = [...notices];
  return result;
}
