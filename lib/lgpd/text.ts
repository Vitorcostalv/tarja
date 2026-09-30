import type { FamiliaTipo } from "./types";

/**
 * Funções de texto do motor. Puras e lineares. Sem regex com quantificador aninhado.
 * O dicionário de apelidos e palavras ignoradas vem de fora (rules/pt-br.ts).
 */

export interface DicionarioTexto {
  /** token abreviado -> token canônico (nasc -> nascimento). */
  apelidos: Record<string, string>;
  /** tokens descartados (prefixos de legado como "ds", "tb"). */
  descartar: ReadonlySet<string>;
  /** "end" só vira "endereco" se o próximo token não for um destes (end_date). */
  endNaoEndereco: ReadonlySet<string>;
}

function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function isLower(c: number): boolean {
  return c >= 97 && c <= 122;
}
function isUpper(c: number): boolean {
  return c >= 65 && c <= 90;
}
function isDigit(c: number): boolean {
  return c >= 48 && c <= 57;
}

/** Quebra um identificador em palavras: snake_case, kebab, camelCase, PascalCase, letras/dígitos. */
export function palavras(identificador: string): string[] {
  const s = semAcento(identificador);
  const out: string[] = [];
  let atual = "";
  const fecha = () => {
    if (atual !== "") out.push(atual.toLowerCase());
    atual = "";
  };
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    const alnum = isLower(c) || isUpper(c) || isDigit(c);
    if (!alnum) {
      fecha();
      continue;
    }
    if (atual !== "") {
      const p = atual.charCodeAt(atual.length - 1);
      const n = i + 1 < s.length ? s.charCodeAt(i + 1) : 0;
      const viraLetraDigito = isDigit(p) !== isDigit(c);
      const minusculaParaMaiuscula = isLower(p) && isUpper(c);
      // "CPFNumero" -> CPF | Numero: maiúscula seguida de minúscula depois de uma sequência de maiúsculas
      const fimDeSigla = isUpper(p) && isUpper(c) && isLower(n);
      if (viraLetraDigito || minusculaParaMaiuscula || fimDeSigla) fecha();
    }
    atual += s[i];
  }
  fecha();
  return out;
}

/** Tokens canônicos de um nome de coluna, já com apelidos aplicados e ruído removido. */
export function tokens(identificador: string, dic: DicionarioTexto): string[] {
  const brutos = palavras(identificador);
  const out: string[] = [];
  for (let i = 0; i < brutos.length; i++) {
    const t = brutos[i] as string;
    if (dic.descartar.has(t)) continue;
    if (t === "end" && !dic.endNaoEndereco.has(brutos[i + 1] ?? "")) {
      out.push("endereco");
      continue;
    }
    if (t === "end") {
      out.push(t);
      continue;
    }
    out.push(dic.apelidos[t] ?? t);
  }
  return out;
}

/** Singular simples para nomes de tabela: clientes -> cliente, paises -> pais, countries -> country. */
export function singular(token: string, protegidos: ReadonlySet<string>): string {
  if (protegidos.has(token) || token.length <= 3) return token;
  if (token.endsWith("ies") && token.length > 4) return token.slice(0, -3) + "y";
  if (token.endsWith("oes")) return token.slice(0, -3) + "ao";
  if (token.endsWith("aes")) return token.slice(0, -3) + "ao";
  if (token.endsWith("ais")) return token.slice(0, -3) + "al";
  if (token.endsWith("eis")) return token.slice(0, -3) + "el";
  if (token.endsWith("res") || token.endsWith("zes") || token.endsWith("ses")) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

const TIPOS_TEXTO = new Set(["char", "varchar", "nchar", "nvarchar", "enum", "set", "json", "national varchar", "national char", "character varying", "character"]);
const TIPOS_TEXTO_LONGO = new Set(["tinytext", "text", "mediumtext", "longtext", "long varchar"]);
const TIPOS_NUMERO = new Set([
  "tinyint", "int", "integer", "smallint", "mediumint", "bigint", "decimal", "numeric", "float", "double", "double precision", "real", "dec", "fixed",
]);
const TIPOS_DATA = new Set(["date", "datetime", "timestamp", "time", "year"]);
const TIPOS_BINARIO = new Set(["blob", "tinyblob", "mediumblob", "longblob", "binary", "varbinary", "long varbinary"]);

export function familiaDoTipo(baseType: string, typeArgs: string | null): FamiliaTipo {
  if (TIPOS_TEXTO_LONGO.has(baseType)) return "texto_longo";
  if (TIPOS_BINARIO.has(baseType)) return "binario";
  if (TIPOS_DATA.has(baseType)) return "data";
  if (baseType === "bool" || baseType === "boolean" || baseType === "bit") return "booleano";
  if (baseType === "tinyint" && typeArgs !== null && typeArgs.trim() === "1") return "booleano";
  if (TIPOS_NUMERO.has(baseType)) return "numero";
  if (TIPOS_TEXTO.has(baseType)) return "texto";
  return "texto";
}

/** Acha `padrao` como subsequência contígua de `alvo`. */
export function contem(alvo: readonly string[], padrao: readonly string[]): boolean {
  if (padrao.length === 0 || padrao.length > alvo.length) return false;
  for (let i = 0; i + padrao.length <= alvo.length; i++) {
    let ok = true;
    for (let j = 0; j < padrao.length; j++) {
      if (alvo[i + j] !== padrao[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

export function igual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
