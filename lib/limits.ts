/** Limites de entrada. Todos com mensagem clara para o usuário. */

export const LIMITS = {
  /** 1 MB, medido em bytes UTF-8 (não em caracteres). */
  maxInputBytes: 1_048_576,
  maxTables: 1_000,
  /** O MySQL aceita no máximo 4096 colunas por tabela. */
  maxColumnsPerTable: 4_096,
  /** Acima disso o identificador é truncado (o MySQL só aceita 64). */
  maxIdentifierLength: 256,
} as const;

/** Tamanho em bytes UTF-8. Evita alocar quando a resposta já é óbvia. */
export function utf8ByteLength(text: string): number {
  // Cada unidade UTF-16 ocupa no mínimo 1 byte em UTF-8, então length já é um piso.
  if (text.length > LIMITS.maxInputBytes) return text.length;
  return new TextEncoder().encode(text).length;
}

export function isOverInputLimit(text: string): boolean {
  return utf8ByteLength(text) > LIMITS.maxInputBytes;
}

export const INPUT_TOO_BIG_MESSAGE =
  "O schema passa de 1 MB (medido em bytes UTF-8). Cole só as tabelas que importam ou divida em partes.";
