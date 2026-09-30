import { isOverInputLimit } from "../limits";
import { ErrorSink, tokenize } from "./tokenizer";
import type { Token } from "./types";

/**
 * Leitor de scripts com rotinas: CREATE PROCEDURE / FUNCTION / TRIGGER / EVENT e comandos soltos
 * (UPDATE, INSERT, DELETE, CALL, ALTER...). Entende DELIMITER. Sem dependência de DOM nem de React.
 *
 * Não é um parser completo de SQL procedural: acha o que as regras de padrão precisam (definer, nome,
 * corpo, comandos de escrita, chamadas) e nunca lança exceção. Entrada maior que 1 MB é recusada.
 */

export type TipoRotina = "procedure" | "function" | "trigger" | "event";

export interface Definer {
  /** Texto como escrito: `root`@`localhost`. */
  raw: string;
  usuario: string | null;
  host: string | null;
}

export interface NomeQualificado {
  schema: string | null;
  nome: string;
}

/** Um comando de dentro do corpo de uma rotina ou solto no script. */
export interface Comando {
  /** Primeira palavra, em maiúsculas: UPDATE, INSERT, DELETE, SELECT, CALL, REPLACE, ALTER, CREATE... */
  tipo: string;
  texto: string;
  linha: number;
  /** Posição do comando dentro do corpo (para saber o que vem antes e depois). */
  ordem: number;
  tokens: Token[];
}

export interface Rotina {
  tipo: TipoRotina;
  nome: string;
  schema: string | null;
  definer: Definer | null;
  linha: number;
  /** Texto do CREATE inteiro. */
  texto: string;
  /** Comandos de escrita e chamada achados no corpo, na ordem. */
  comandos: Comando[];
  /** Quantos comandos executáveis (fora DECLARE) o corpo tem no nível de cima. */
  totalDeComandos: number;
  /** O único comando, quando o corpo é um comando só (INSERT/UPDATE/DELETE/SELECT/REPLACE). */
  comandoUnico: Comando | null;
}

export interface ResultadoRotinas {
  rotinas: Rotina[];
  /** Comandos fora de rotina: UPDATE, INSERT, DELETE, REPLACE, CALL, ALTER, DROP, CREATE TABLE... */
  comandosSoltos: Comando[];
  rejeitado: boolean;
}

const INICIO_DE_ROTINA = new Set(["procedure", "function", "trigger", "event"]);
const DML = new Set(["update", "insert", "delete", "replace", "select", "call"]);
const INICIO_DE_COMANDO_APOS = new Set(["then", "else", "do", "begin", "loop", "repeat"]);
const COMANDOS_SOLTOS = new Set(["update", "insert", "delete", "replace", "call", "alter", "drop", "create", "truncate", "rename"]);

function palavra(t: Token | undefined): string {
  return t && t.kind === "word" ? t.value.toLowerCase() : "";
}
function ehPunct(t: Token | undefined, v: string): boolean {
  return !!t && t.kind === "punct" && t.value === v;
}
function ehNome(t: Token | undefined): t is Token {
  return !!t && (t.kind === "word" || t.kind === "backtick" || t.kind === "dstring" || t.kind === "string");
}

/** Quebra os tokens em instruções, respeitando DELIMITER. */
function instrucoes(tokens: Token[]): Token[][] {
  const out: Token[][] = [];
  let delim = ";";
  let atual: Token[] = [];
  const n = tokens.length;

  const casaDelimitador = (i: number): number => {
    // Devolve quantos tokens o delimitador ocupa em i (0 se não casa). Os tokens têm de ser contíguos.
    let texto = "";
    let k = i;
    while (k < n && texto.length < delim.length) {
      const t = tokens[k] as Token;
      if (k > i && (tokens[k - 1] as Token).end !== t.start) return 0;
      texto += t.value;
      k++;
    }
    return texto === delim ? k - i : 0;
  };

  // Sem DELIMITER, um CREATE PROCEDURE/TRIGGER/EVENT com BEGIN...END tem ";" dentro do corpo. Quem cola sem o
  // DELIMITER espera que funcione, então acompanhamos BEGIN/CASE ... END e só fechamos a instrução no ";" de fora.
  let profundidade = 0;
  let emRotina = false;
  const fecha = (): void => {
    if (atual.length > 0) out.push(atual);
    atual = [];
    profundidade = 0;
    emRotina = false;
  };
  const acompanha = (t: Token, proximo: Token | undefined): void => {
    const w = palavra(t);
    if (!emRotina) {
      if (atual.length > 0 && palavra(atual[0]) === "create" && INICIO_DE_ROTINA.has(w) && atual.length <= 24) emRotina = true;
      return;
    }
    if (w === "begin" || w === "case") profundidade++;
    else if (w === "end") {
      const seguinte = palavra(proximo);
      if (!(seguinte === "if" || seguinte === "while" || seguinte === "loop" || seguinte === "repeat")) profundidade = Math.max(0, profundidade - 1);
    }
  };

  let i = 0;
  while (i < n) {
    const t = tokens[i] as Token;
    if (atual.length === 0 && palavra(t) === "delimiter") {
      let k = i + 1;
      let novo = "";
      while (k < n && (tokens[k] as Token).line === t.line) {
        novo += (tokens[k] as Token).value;
        k++;
      }
      if (novo !== "") delim = novo;
      i = k;
      continue;
    }
    // "END$$": o "$" é caractere de palavra, então o delimitador vem colado no fim da palavra anterior.
    if (t.kind === "word" && delim.length > 0 && !/^\w/.test(delim) && t.value.length > delim.length && t.value.endsWith(delim)) {
      atual.push({ ...t, value: t.value.slice(0, -delim.length), end: t.end - delim.length });
      fecha();
      i++;
      continue;
    }
    const tamanho = casaDelimitador(i);
    if (tamanho > 0 && !(delim === ";" && emRotina && profundidade > 0)) {
      fecha();
      i += tamanho;
      continue;
    }
    atual.push(t);
    acompanha(t, tokens[i + 1]);
    i++;
  }
  if (atual.length > 0) out.push(atual);
  return out;
}

function textoDe(fonte: string, tokens: Token[]): string {
  if (tokens.length === 0) return "";
  return fonte.slice((tokens[0] as Token).start, (tokens[tokens.length - 1] as Token).end);
}

/** Acha os comandos de DML/CALL dentro de uma sequência de tokens (corpo de rotina ou comando solto). */
export function comandosDeDml(fonte: string, tokens: Token[]): Comando[] {
  const out: Comando[] = [];
  let inicioDeComando = true;
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i] as Token;
    const w = palavra(t);
    if (inicioDeComando && DML.has(w)) {
      let fim = i;
      while (fim < tokens.length && !ehPunct(tokens[fim], ";")) fim++;
      const fatia = tokens.slice(i, fim);
      out.push({ tipo: w.toUpperCase(), texto: textoDe(fonte, fatia), linha: t.line, ordem: out.length, tokens: fatia });
      inicioDeComando = false;
      i++;
      continue;
    }
    if (ehPunct(t, ";") || INICIO_DE_COMANDO_APOS.has(w)) inicioDeComando = true;
    else if (t.kind === "punct" && t.value === ":") inicioDeComando = true; // rótulo "lbl: BEGIN"
    else inicioDeComando = false;
    i++;
  }
  return out;
}

function lerDefiner(fonte: string, tokens: Token[], i: number): { definer: Definer; proximo: number } | null {
  if (palavra(tokens[i]) !== "definer") return null;
  let k = i + 1;
  if (ehPunct(tokens[k], "=")) k++;
  const inicio = k;
  while (k < tokens.length && !INICIO_DE_ROTINA.has(palavra(tokens[k])) && palavra(tokens[k]) !== "sql") k++;
  const partes = tokens.slice(inicio, k);
  const raw = textoDe(fonte, partes).trim();
  const arroba = partes.findIndex((p) => ehPunct(p, "@"));
  let usuario: string | null = null;
  let host: string | null = null;
  if (arroba === -1) {
    usuario = partes.map((p) => p.value).join("").replace(/\(\)$/, "") || null;
  } else {
    usuario = partes.slice(0, arroba).map((p) => p.value).join("") || null;
    host = partes.slice(arroba + 1).map((p) => p.value).join("") || null;
  }
  return { definer: { raw, usuario, host }, proximo: k };
}

function nomeQualificado(tokens: Token[], i: number): { nome: NomeQualificado; proximo: number } | null {
  const a = tokens[i];
  if (!ehNome(a)) return null;
  if (ehPunct(tokens[i + 1], ".") && ehNome(tokens[i + 2])) {
    return { nome: { schema: a.value, nome: (tokens[i + 2] as Token).value }, proximo: i + 3 };
  }
  return { nome: { schema: null, nome: a.value }, proximo: i + 1 };
}

/** Onde o corpo começa, conforme o tipo de rotina. */
function inicioDoCorpo(tokens: Token[], depoisDoNome: number, tipo: TipoRotina): number {
  let k = depoisDoNome;
  if (tipo === "event") {
    while (k < tokens.length && palavra(tokens[k]) !== "do") k++;
    return Math.min(k + 1, tokens.length);
  }
  if (tipo === "trigger") {
    while (k < tokens.length && !(palavra(tokens[k]) === "each" && palavra(tokens[k + 1]) === "row")) k++;
    return Math.min(k + 2, tokens.length);
  }
  // procedure e function: pula a lista de parâmetros e as características (RETURNS, COMMENT, DETERMINISTIC...)
  if (ehPunct(tokens[k], "(")) {
    let depth = 0;
    for (; k < tokens.length; k++) {
      if (ehPunct(tokens[k], "(")) depth++;
      else if (ehPunct(tokens[k], ")")) {
        depth--;
        if (depth === 0) {
          k++;
          break;
        }
      }
    }
  }
  const comecos = new Set(["begin", "insert", "update", "delete", "replace", "select", "call", "set", "if", "while", "loop", "repeat", "case", "return", "declare"]);
  while (k < tokens.length && !comecos.has(palavra(tokens[k]))) k++;
  return k;
}

function analisarCorpo(fonte: string, corpo: Token[]): { comandos: Comando[]; total: number; unico: Comando | null } {
  let miolo = corpo;
  if (palavra(miolo[0]) === "begin") {
    miolo = miolo.slice(1);
    if (palavra(miolo[miolo.length - 1]) === "end") miolo = miolo.slice(0, -1);
  }
  const comandos = comandosDeDml(fonte, corpo);
  // Comandos de nível de cima: separados por ";", sem contar DECLARE.
  const segmentos: Token[][] = [];
  let atual: Token[] = [];
  for (const t of miolo) {
    if (ehPunct(t, ";")) {
      if (atual.length) segmentos.push(atual);
      atual = [];
    } else atual.push(t);
  }
  if (atual.length) segmentos.push(atual);
  const executaveis = segmentos.filter((s) => palavra(s[0]) !== "declare");
  let unico: Comando | null = null;
  if (executaveis.length === 1) {
    const s = executaveis[0] as Token[];
    const w = palavra(s[0]);
    if (["insert", "update", "delete", "replace", "select"].includes(w)) {
      unico = { tipo: w.toUpperCase(), texto: textoDe(fonte, s), linha: (s[0] as Token).line, ordem: 0, tokens: s };
    }
  }
  return { comandos, total: executaveis.length, unico };
}

export function lerRotinas(texto: string): ResultadoRotinas {
  const vazio: ResultadoRotinas = { rotinas: [], comandosSoltos: [], rejeitado: false };
  if (isOverInputLimit(texto)) return { ...vazio, rejeitado: true };
  const tokens = tokenize(texto, new ErrorSink());
  const rotinas: Rotina[] = [];
  const soltos: Comando[] = [];

  for (const inst of instrucoes(tokens)) {
    const w0 = palavra(inst[0]);
    if (w0 === "create") {
      let k = 1;
      let definer: Definer | null = null;
      let tipo: TipoRotina | null = null;
      for (let guard = 0; k < inst.length && guard < 24; guard++) {
        const w = palavra(inst[k]);
        if (INICIO_DE_ROTINA.has(w)) {
          tipo = w as TipoRotina;
          k++;
          break;
        }
        if (w === "definer") {
          const r = lerDefiner(texto, inst, k);
          if (r) {
            definer = r.definer;
            k = r.proximo;
            continue;
          }
        }
        if (w === "table" || w === "view" || w === "index" || w === "database" || w === "schema" || w === "temporary" && palavra(inst[k + 1]) === "table") break;
        k++;
      }
      if (tipo) {
        const nome = nomeQualificado(inst, k);
        if (nome) {
          const corpoIni = inicioDoCorpo(inst, nome.proximo, tipo);
          const corpo = inst.slice(corpoIni);
          const a = analisarCorpo(texto, corpo);
          rotinas.push({
            tipo,
            nome: nome.nome.nome,
            schema: nome.nome.schema,
            definer,
            linha: (inst[0] as Token).line,
            texto: textoDe(texto, inst),
            comandos: a.comandos,
            totalDeComandos: a.total,
            comandoUnico: a.unico,
          });
          continue;
        }
      }
    }
    if (COMANDOS_SOLTOS.has(w0)) {
      // CREATE TABLE, ALTER e DROP entram como comando solto para a regra de qualificação de schema.
      if (["update", "insert", "delete", "replace", "call"].includes(w0)) {
        soltos.push(...comandosDeDml(texto, inst));
      } else {
        soltos.push({ tipo: w0.toUpperCase(), texto: textoDe(texto, inst), linha: (inst[0] as Token).line, ordem: soltos.length, tokens: inst });
      }
    }
  }
  return { rotinas, comandosSoltos: soltos, rejeitado: false };
}

/** Nomes de tabela/rotina referenciados por um comando: depois de FROM, JOIN, INTO, UPDATE, TABLE e CALL. */
export function referenciasDoComando(c: Comando): Array<NomeQualificado & { via: string; linha: number }> {
  const out: Array<NomeQualificado & { via: string; linha: number }> = [];
  const t = c.tokens;
  for (let i = 0; i < t.length; i++) {
    const w = palavra(t[i]);
    if (!["from", "join", "into", "update", "table", "call"].includes(w)) continue;
    let j = i + 1;
    if (w === "table" && palavra(t[j]) === "if") j += 3; // IF [NOT] EXISTS
    if (w === "table" && palavra(t[j]) === "if") j++;
    const q = nomeQualificado(t, j);
    if (q && !ehPunct(t[j], "(")) out.push({ ...q.nome, via: w, linha: (t[i] as Token).line });
  }
  return out;
}

/** Nomes de coluna que são alvo de atribuição em UPDATE ... SET e em ON DUPLICATE KEY UPDATE. */
export function alvosDeAtribuicao(c: Comando): string[] {
  const t = c.tokens;
  const alvos: string[] = [];

  const lerAtribuicoes = (inicio: number): void => {
    let depth = 0;
    let comecoDaAtribuicao = true;
    let ultimoNome: string | null = null;
    for (let i = inicio; i < t.length; i++) {
      const tok = t[i] as Token;
      const w = palavra(tok);
      if (depth === 0 && (w === "where" || w === "order" || w === "limit" || w === "returning")) break;
      if (ehPunct(tok, "(")) depth++;
      else if (ehPunct(tok, ")")) depth--;
      else if (depth === 0 && ehPunct(tok, ",")) {
        comecoDaAtribuicao = true;
        ultimoNome = null;
      } else if (depth === 0 && ehPunct(tok, "=") && comecoDaAtribuicao) {
        if (ultimoNome) alvos.push(ultimoNome.toLowerCase());
        comecoDaAtribuicao = false;
      } else if (comecoDaAtribuicao && (tok.kind === "word" || tok.kind === "backtick")) ultimoNome = tok.value;
    }
  };

  for (let i = 0; i < t.length; i++) {
    if (palavra(t[i]) === "set" && c.tipo === "UPDATE") {
      lerAtribuicoes(i + 1);
      break;
    }
  }
  for (let i = 0; i + 3 < t.length; i++) {
    if (palavra(t[i]) === "on" && palavra(t[i + 1]) === "duplicate" && palavra(t[i + 2]) === "key" && palavra(t[i + 3]) === "update") {
      lerAtribuicoes(i + 4);
      break;
    }
  }
  return alvos;
}
