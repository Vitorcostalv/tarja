import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { parseDdl } from "../../lib/sql/parser";

const VALID = `-- loja
CREATE TABLE \`clientes\` (
  id INT NOT NULL AUTO_INCREMENT COMMENT 'chave, primária',
  nome VARCHAR(100) NOT NULL,
  status ENUM('a,b','c''d') DEFAULT 'a',
  /* bloco */ cpf CHAR(14) NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk FOREIGN KEY (id) REFERENCES outra (id)
) ENGINE=InnoDB COMMENT='clientes';
ALTER TABLE clientes ADD x INT;
CREATE TABLE pedidos (id BIGINT, total DECIMAL(10,2));`;

/** Estraga um texto válido: apaga, insere ou troca pedaços em posições aleatórias. */
const mutated = fc
  .array(
    fc.record({
      at: fc.nat(VALID.length),
      del: fc.nat(12),
      ins: fc.constantFrom("", "'", '"', "`", "(", ")", ",", ";", "/*", "*/", "--", "#", "\\", "\n", "é", "\u0000", "CREATE TABLE "),
    }),
    { minLength: 1, maxLength: 8 },
  )
  .map((ops) => {
    let s = VALID;
    for (const op of ops) s = s.slice(0, op.at) + op.ins + s.slice(op.at + op.del);
    return s;
  });

const inputs = fc.oneof(
  fc.string({ maxLength: 400 }),
  fc.string({ unit: "binary", maxLength: 400 }),
  mutated,
  fc.array(fc.constantFrom("CREATE", "TABLE", "(", ")", ",", ";", "'", "`", '"', "INT", "a", "--", "/*", "*/", " ", "\n", "COMMENT", "ENUM", "NOT NULL"), { maxLength: 60 }).map((p) => p.join(" ")),
);

describe("parseDdl: propriedades", () => {
  it("nunca lança exceção, com entrada aleatória, binária ou corrompida", () => {
    fc.assert(
      fc.property(inputs, (text) => {
        const r = parseDdl(text);
        expect(Array.isArray(r.tables)).toBe(true);
        expect(Array.isArray(r.errors)).toBe(true);
      }),
      { numRuns: 1500 },
    );
  });

  it("mesma entrada, mesma saída", () => {
    fc.assert(
      fc.property(inputs, (text) => {
        expect(parseDdl(text)).toEqual(parseDdl(text));
      }),
      { numRuns: 500 },
    );
  });

  it("toda coluna e tabela tem nome (string) e linha positiva", () => {
    fc.assert(
      fc.property(inputs, (text) => {
        for (const t of parseDdl(text).tables) {
          expect(typeof t.name).toBe("string");
          expect(t.line).toBeGreaterThan(0);
          for (const c of t.columns) {
            expect(typeof c.name).toBe("string");
            expect(c.line).toBeGreaterThan(0);
          }
        }
      }),
      { numRuns: 500 },
    );
  });

  it("erros apontam linha e coluna dentro do texto", () => {
    fc.assert(
      fc.property(mutated, (text) => {
        const lines = text.split("\n").length;
        for (const e of parseDdl(text).errors) {
          if (e.line === 0) continue; // aviso geral, sem posição
          expect(e.line).toBeGreaterThanOrEqual(1);
          expect(e.line).toBeLessThanOrEqual(lines);
          expect(e.col).toBeGreaterThanOrEqual(1);
        }
      }),
      { numRuns: 500 },
    );
  });

  it("termina rápido com entrada pequena e hostil (limite de tempo)", () => {
    const t0 = performance.now();
    fc.assert(
      fc.property(fc.array(fc.constantFrom("(", ")", "'", '"', "`", "/*", "--", ",", ";", "CREATE TABLE t ("), { maxLength: 300 }).map((p) => p.join("")), (text) => {
        parseDdl(text);
      }),
      { numRuns: 500 },
    );
    expect(performance.now() - t0).toBeLessThan(10_000);
  });
});
