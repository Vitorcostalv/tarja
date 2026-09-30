import { describe, expect, it } from "vitest";
import { parseDdl } from "../../lib/sql/parser";
import { LIMITS } from "../../lib/limits";

/**
 * Entrada hostil de até 1 MB. O teste falha por tempo: se alguma varredura virar
 * quadrática (ou houver backtracking), 1 MB leva minutos, não segundos.
 */
const MAX_MS = 5_000;
const MB = LIMITS.maxInputBytes;

function timed(text: string) {
  expect(Buffer.byteLength(text)).toBeLessThanOrEqual(MB);
  const t0 = performance.now();
  const r = parseDdl(text);
  const ms = performance.now() - t0;
  expect(ms).toBeLessThan(MAX_MS);
  return { r, ms };
}

describe("parser com entrada hostil de 1 MB", () => {
  const cases: Array<[string, string]> = [
    ["1 MB de '(' numa linha só", "(".repeat(MB)],
    ["1 MB de ')' numa linha só", ")".repeat(MB)],
    ["corpo de tabela com 1 MB de '('", "CREATE TABLE t (" + "(".repeat(MB - 20)],
    ["aspas simples soltas", "'".repeat(MB)],
    ["aspas duplas soltas", '"'.repeat(MB)],
    ["crases soltas", "`".repeat(MB)],
    ["aspas soltas, uma por linha", "'\n".repeat(MB / 2)],
    ["'/*' repetido sem fechar", "/*".repeat(MB / 2)],
    ["comentários '--' um por linha", "-- x\n".repeat(MB / 5)],
    ["barras invertidas dentro de string", "'" + "\\".repeat(MB - 2)],
    ["'CREATE TABLE t (' repetido sem fechar", "CREATE TABLE t (".repeat(MB / 16)],
    ["vírgulas em sequência", "CREATE TABLE t (" + ",".repeat(MB - 20) + ")"],
    ["ENUM gigante", "CREATE TABLE t (e ENUM(" + "'a',".repeat((MB - 60) / 4) + "'z'));"],
    ["linha única com milhares de colunas", "CREATE TABLE t (" + Array.from({ length: 40_000 }, (_, i) => `c${i} INT`).join(",") + ");"],
    ["milhares de tabelas sem ';'", Array.from({ length: 30_000 }, (_, i) => `CREATE TABLE t${i} (a INT)`).join("\n")],
    ["lixo binário", Array.from({ length: MB / 2 }, (_, i) => String.fromCharCode((i * 7919) % 256)).join("")],
  ];

  for (const [name, text] of cases) {
    it(`não lança nem trava: ${name}`, () => {
      const { r } = timed(text.slice(0, MB));
      expect(r).toBeDefined();
    });
  }

  it("1 MB realista de DDL (centenas de tabelas) é analisado por inteiro", () => {
    const table = (i: number) =>
      `CREATE TABLE \`tabela_${i}\` (\n  id INT NOT NULL AUTO_INCREMENT,\n  nome VARCHAR(100) NOT NULL COMMENT 'nome, da tabela ${i}',\n  cpf CHAR(14),\n  status ENUM('a','b','c'),\n  criado_em DATETIME,\n  PRIMARY KEY (id)\n) ENGINE=InnoDB;\n`;
    let text = "";
    let i = 0;
    while (Buffer.byteLength(text) + 400 < MB) text += table(i++);
    const { r } = timed(text);
    expect(r.rejected).toBe(false);
    expect(r.tables.length).toBe(Math.min(i, LIMITS.maxTables));
    expect(r.errors).toEqual([]);
  });
});
