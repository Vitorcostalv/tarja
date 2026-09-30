/** Tipos do parser de CREATE TABLE (MySQL). Sem dependência de DOM nem de React. */

export type TokenKind =
  | "word" // palavra sem aspas ou número: CREATE, varchar, 14, nome_ç
  | "backtick" // `nome`
  | "string" // 'texto'
  | "dstring" // "texto" (em MySQL é string; aceitamos como nome também)
  | "punct"; // ( ) , ; = . e qualquer outro caractere solto

export interface Token {
  kind: TokenKind;
  /** Valor sem aspas e com escapes resolvidos (para word/punct é o texto cru). */
  value: string;
  /** Posição no texto original: [start, end). */
  start: number;
  end: number;
  line: number;
  col: number;
}

export interface ParseError {
  message: string;
  /** Trecho problemático, já truncado para exibição. */
  snippet: string;
  line: number;
  col: number;
}

export interface ParsedColumn {
  name: string;
  /** Tipo como escrito no DDL, ex.: "VARCHAR(14)", "enum('a','b')". */
  rawType: string;
  /** Tipo base em minúsculas, ex.: "varchar". */
  baseType: string;
  /** Argumentos entre parênteses do tipo, cru. Ex.: "14" ou "10,2". */
  typeArgs: string | null;
  /** Valores de ENUM/SET, sem aspas. Vazio se não for ENUM/SET. */
  enumValues: string[];
  nullable: boolean;
  isPrimaryKey: boolean;
  autoIncrement: boolean;
  hasDefault: boolean;
  comment: string | null;
  line: number;
}

export interface ParsedForeignKey {
  columns: string[];
  refTable: string;
  refColumns: string[];
}

export interface ParsedTable {
  name: string;
  schema: string | null;
  columns: ParsedColumn[];
  primaryKey: string[];
  foreignKeys: ParsedForeignKey[];
  comment: string | null;
  line: number;
}

/** Instruções que reconhecemos mas que ficam fora do escopo do MVP. */
export interface IgnoredStatement {
  kind: string;
  line: number;
}

export interface ParseResult {
  tables: ParsedTable[];
  errors: ParseError[];
  ignored: IgnoredStatement[];
  /** true quando a entrada foi recusada (ex.: acima de 1 MB). Nada foi analisado. */
  rejected: boolean;
  /** Mensagens de limite atingido (tabelas, colunas, identificador). */
  limitNotices: string[];
}
