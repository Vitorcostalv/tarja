import type { ParseError, Token } from "./types";

/**
 * Tokenizador de SQL (subconjunto MySQL).
 *
 * Varredura linear, um caractere por vez, sem regex com quantificador aninhado,
 * então não há backtracking catastrófico. Nunca lança exceção.
 */

const SNIPPET_MAX = 80;
const MAX_ERRORS = 200;

/** Junta erros com teto, para entrada hostil não gerar milhares de mensagens. */
export class ErrorSink {
  readonly errors: ParseError[] = [];
  private dropped = 0;

  push(error: ParseError): void {
    if (this.errors.length < MAX_ERRORS) this.errors.push(error);
    else this.dropped++;
  }

  /** Fecha a lista, acrescentando o aviso de erros omitidos se houver. */
  finish(): ParseError[] {
    if (this.dropped > 0) {
      this.errors.push({
        message: `Mais ${this.dropped} problemas de sintaxe não foram listados.`,
        snippet: "",
        line: 0,
        col: 0,
      });
      this.dropped = 0;
    }
    return this.errors;
  }
}

export function snippetOf(text: string, start: number, length = SNIPPET_MAX): string {
  const raw = text.slice(start, start + length);
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    out += c === 10 || c === 13 || c === 9 ? " " : raw[i];
  }
  return out.trim();
}

function isWordChar(code: number): boolean {
  return (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    code === 95 || // _
    code === 36 || // $
    code > 127 // letras acentuadas e outros caracteres Unicode
  );
}

function isSpace(code: number): boolean {
  return code <= 32 || code === 0xa0 || code === 0xfeff;
}

const ESCAPES: Record<string, string> = {
  n: "\n",
  t: "\t",
  r: "\r",
  "0": "\0",
  b: "\b",
  Z: "\x1a",
};

export function tokenize(text: string, sink: ErrorSink): Token[] {
  const tokens: Token[] = [];
  const n = text.length;
  let i = 0;
  let line = 1;
  let lineStart = 0;
  // Depois da primeira aspa sem fechamento, as seguintes só procuram até o fim da linha.
  // Isso mantém a varredura linear mesmo com milhares de aspas soltas.
  const lineMode: Record<string, boolean> = { "'": false, '"': false, "`": false };

  const advanceTo = (to: number): void => {
    for (let k = i; k < to; k++) {
      if (text.charCodeAt(k) === 10) {
        line++;
        lineStart = k + 1;
      }
    }
    i = to;
  };

  const readQuoted = (quote: string): void => {
    const startLine = line;
    const startCol = i - lineStart + 1;
    const start = i;
    let limit = n;
    if (lineMode[quote]) {
      const nl = text.indexOf("\n", i);
      limit = nl === -1 ? n : nl;
    }
    let j = i + 1;
    let value = "";
    let closed = false;
    while (j < limit) {
      const ch = text[j] as string;
      if (ch === quote) {
        if (text[j + 1] === quote && j + 1 < limit) {
          value += quote;
          j += 2;
          continue;
        }
        closed = true;
        j++;
        break;
      }
      if (ch === "\\" && quote !== "`" && j + 1 < limit) {
        const next = text[j + 1] as string;
        value += ESCAPES[next] ?? next;
        j += 2;
        continue;
      }
      value += ch;
      j++;
    }
    if (!closed && !lineMode[quote]) {
      lineMode[quote] = true;
      readQuoted(quote); // refaz só até o fim da linha
      return;
    }
    if (!closed) {
      sink.push({
        message: `Aspas ${quote} sem fechamento.`,
        snippet: snippetOf(text, start),
        line: startLine,
        col: startCol,
      });
    }
    const kind = quote === "`" ? "backtick" : quote === "'" ? "string" : "dstring";
    tokens.push({ kind, value, start, end: j, line: startLine, col: startCol });
    advanceTo(j);
  };

  while (i < n) {
    const code = text.charCodeAt(i);

    if (isSpace(code)) {
      advanceTo(i + 1);
      continue;
    }

    const ch = text[i] as string;

    // Comentário de linha: "-- " (o MySQL exige espaço ou controle depois) e "#".
    if (
      ch === "#" ||
      (ch === "-" && text[i + 1] === "-" && (i + 2 >= n || isSpace(text.charCodeAt(i + 2))))
    ) {
      const nl = text.indexOf("\n", i);
      advanceTo(nl === -1 ? n : nl);
      continue;
    }

    // Comentário de bloco. "/*! ... */" (código condicional do mysqldump) também é tratado como comentário.
    if (ch === "/" && text[i + 1] === "*") {
      const close = text.indexOf("*/", i + 2);
      if (close === -1) {
        sink.push({
          message: "Comentário /* sem fechamento. O resto do texto foi ignorado.",
          snippet: snippetOf(text, i),
          line,
          col: i - lineStart + 1,
        });
        advanceTo(n);
      } else {
        advanceTo(close + 2);
      }
      continue;
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      readQuoted(ch);
      continue;
    }

    if (isWordChar(code)) {
      const start = i;
      let j = i + 1;
      while (j < n && isWordChar(text.charCodeAt(j))) j++;
      tokens.push({
        kind: "word",
        value: text.slice(start, j),
        start,
        end: j,
        line,
        col: start - lineStart + 1,
      });
      i = j; // palavras não atravessam linhas
      continue;
    }

    tokens.push({
      kind: "punct",
      value: ch,
      start: i,
      end: i + 1,
      line,
      col: i - lineStart + 1,
    });
    i++;
  }

  return tokens;
}
