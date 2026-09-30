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
  /** Expressão do DEFAULT, como escrita (ex.: "'0.00'", "CURRENT_TIMESTAMP"). null se não há DEFAULT. */
  defaultRaw: string | null;
  unsigned: boolean;
  /** CHARACTER SET / CHARSET declarado na coluna. */
  charset: string | null;
  /** COLLATE declarado na coluna. */
  collate: string | null;
  /** Expressão de ON UPDATE (ex.: "CURRENT_TIMESTAMP"). */
  onUpdateRaw: string | null;
  comment: string | null;
  line: number;
}

export interface ParsedForeignKey {
  columns: string[];
  refTable: string;
  refColumns: string[];
}

export interface ParsedIndex {
  name: string | null;
  unique: boolean;
  /** "key" (KEY/INDEX), "fulltext" ou "spatial". A chave primária fica em ParsedTable.primaryKey. */
  kind: "key" | "fulltext" | "spatial";
  columns: string[];
  line: number;
}

/** Opções depois do ")" do CREATE TABLE. null = não declarado. */
export interface TableOptions {
  engine: string | null;
  charset: string | null;
  collate: string | null;
  /** AUTO_INCREMENT=n declarado na tabela. */
  autoIncrement: string | null;
}

export interface ParsedTable {
  name: string;
  schema: string | null;
  columns: ParsedColumn[];
  primaryKey: string[];
  foreignKeys: ParsedForeignKey[];
  indexes: ParsedIndex[];
  options: TableOptions;
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
