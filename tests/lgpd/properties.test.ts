import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { loadCorpus } from "../../corpus/load";
import { analisar, analisarDdl } from "../../lib/lgpd/analyze";
import { parseDdl } from "../../lib/sql/parser";
import type { ParseResult, ParsedTable } from "../../lib/sql/types";

// Só corpora que estão inteiros no repositório (o externo depende de `npm run corpus:fetch`).
const CORPUS = [...loadCorpus("corpus/dev"), ...loadCorpus("corpus/validation"), ...loadCorpus("corpus/validation-v2")];
const TABELAS: ParsedTable[] = CORPUS.flatMap((s) => parseDdl(s.sql).tables);

const VALID = `CREATE TABLE \`clientes\` (id INT, nome VARCHAR(100) COMMENT 'nome, completo', cpf CHAR(14), obs TEXT);
CREATE TABLE logs (id INT, ip VARCHAR(45), email VARCHAR(80));`;

const mutado = fc
  .array(
    fc.record({
      at: fc.nat(VALID.length),
      del: fc.nat(10),
      ins: fc.constantFrom("", "'", "`", "(", ")", ",", ";", "/*", "--", "é", "CREATE TABLE ", "cpf ", "\u0000"),
    }),
    { minLength: 1, maxLength: 6 },
  )
  .map((ops) => {
    let s = VALID;
    for (const op of ops) s = s.slice(0, op.at) + op.ins + s.slice(op.at + op.del);
    return s;
  });

const entradas = fc.oneof(fc.string({ maxLength: 300 }), mutado, fc.string({ unit: "binary", maxLength: 200 }));

/** Assinatura da decisão sobre uma coluna, sem depender da posição. */
function assinatura(p: ParseResult): Record<string, string> {
  const a = analisar(p);
  const out: Record<string, string> = {};
  for (const t of a.tabelas) {
    for (const c of t.colunas) {
      out[`${c.tabela}.${c.coluna}`] = [c.categoria, c.subtipo, c.pessoal, c.confianca, c.ruleId, c.pontuacao, c.motivo].join("|");
    }
  }
  return out;
}

function achadosOrdenados(p: ParseResult): string[] {
  return analisar(p)
    .achados.map((a) => `${a.id}|${a.tabela}|${a.coluna ?? ""}|${a.gravidade}`)
    .sort();
}

describe("propriedades do motor", () => {
  it("nunca lança, e toda coluna lida recebe exatamente uma classificação", () => {
    fc.assert(
      fc.property(entradas, (texto) => {
        const { parse, analise } = analisarDdl(texto);
        expect(analise.tabelas).toHaveLength(parse.tables.length);
        parse.tables.forEach((t, i) => {
          const a = analise.tabelas[i]!;
          expect(a.colunas).toHaveLength(t.columns.length);
          a.colunas.forEach((c, j) => {
            expect(c.coluna).toBe(t.columns[j]!.name);
            expect(typeof c.categoria).toBe("string");
            expect(c.motivo.length).toBeGreaterThan(0);
            expect(["alta", "media", "baixa"]).toContain(c.confianca);
          });
        });
      }),
      { numRuns: 800 },
    );
  });

  it("mesma entrada, mesma saída", () => {
    fc.assert(
      fc.property(entradas, (texto) => {
        expect(analisarDdl(texto)).toEqual(analisarDdl(texto));
      }),
      { numRuns: 300 },
    );
  });

  it("a ordem das tabelas e das colunas não muda a classificação nem os achados", () => {
    fc.assert(
      fc.property(
        fc.shuffledSubarray(TABELAS, { minLength: 1, maxLength: 12 }),
        fc.infiniteStream(fc.nat(1000)),
        (subconjunto, sementes) => {
          const original: ParseResult = { tables: subconjunto, errors: [], ignored: [], rejected: false, limitNotices: [] };
          const base = assinatura(original);
          const baseAchados = achadosOrdenados(original);

          const it = sementes[Symbol.iterator]();
          const embaralhar = <T,>(xs: T[]): T[] =>
            xs
              .map((x) => ({ x, k: it.next().value as number }))
              .sort((a, b) => a.k - b.k)
              .map((p) => p.x);
          const permutado: ParseResult = {
            ...original,
            tables: embaralhar(subconjunto).map((t) => ({ ...t, columns: embaralhar(t.columns) })),
          };
          expect(assinatura(permutado)).toEqual(base);
          expect(achadosOrdenados(permutado)).toEqual(baseAchados);
        },
      ),
      { numRuns: 150 },
    );
  });

  it("o mesmo nome de coluna em tabelas diferentes é decidido pelo contexto, sem vazar entre tabelas", () => {
    fc.assert(
      fc.property(fc.boolean(), (inverter) => {
        const a = "CREATE TABLE clientes (nome VARCHAR(50));";
        const b = "CREATE TABLE produtos (nome VARCHAR(50));";
        const r = analisarDdl(inverter ? b + a : a + b).analise;
        const get = (t: string) => r.tabelas.find((x) => x.nome === t)!.colunas[0]!;
        expect(get("clientes").pessoal).toBe("sim");
        expect(get("produtos").pessoal).toBe("nao");
      }),
    );
  });

  it("corrigir à mão uma coluna não muda as outras", () => {
    const ddl = "CREATE TABLE clientes (nome VARCHAR(50), cpf CHAR(11), obs TEXT);";
    const antes = analisarDdl(ddl).analise.tabelas[0]!.colunas;
    const depois = analisarDdl(ddl, { "clientes.obs": { categoria: "sensivel", subtipo: "saude" } }).analise.tabelas[0]!.colunas;
    expect(depois[0]).toEqual(antes[0]);
    expect(depois[1]).toEqual(antes[1]);
    expect(depois[2]!.origem).toBe("manual");
  });
});
