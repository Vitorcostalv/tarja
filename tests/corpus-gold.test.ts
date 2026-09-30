import { describe, expect, it } from "vitest";
import { loadCorpus } from "../corpus/load";
import { parseDdl } from "../lib/sql/parser";

/**
 * Confere só a consistência entre os .sql e os gabaritos (nenhuma coluna sem gabarito,
 * nenhum gabarito sem coluna). Não usa o classificador.
 */
for (const corpus of ["dev", "validation", "external"] as const) {
  describe(`corpus ${corpus}: gabarito x DDL`, () => {
    const schemas = loadCorpus(`corpus/${corpus}`);

    it("existem os schemas esperados", () => {
      expect(schemas.length).toBe(corpus === "external" ? 3 : 5);
    });

    for (const s of schemas) {
      it(`${s.name}: o DDL não tem erro de sintaxe`, () => {
        const r = parseDdl(s.sql);
        expect(r.errors).toEqual([]);
        expect(r.limitNotices).toEqual([]);
      });

      it(`${s.name}: cada coluna do DDL tem exatamente uma linha no gabarito, e vice-versa`, () => {
        const parsed = parseDdl(s.sql);
        const fromSql = parsed.tables.flatMap((t) => t.columns.map((c) => `${t.name}.${c.name}`));
        const fromGold = s.gold.columns.map((c) => c.key);
        expect(new Set(fromSql).size).toBe(fromSql.length);
        expect(fromGold.filter((k) => !fromSql.includes(k))).toEqual([]);
        expect(fromSql.filter((k) => !fromGold.includes(k))).toEqual([]);
      });

      it(`${s.name}: os achados do gabarito apontam para tabelas/colunas que existem`, () => {
        const parsed = parseDdl(s.sql);
        const targets = new Set([
          ...parsed.tables.map((t) => t.name),
          ...parsed.tables.flatMap((t) => t.columns.map((c) => `${t.name}.${c.name}`)),
        ]);
        for (const f of s.gold.findings) expect(targets.has(f.target), `${f.id} ${f.target}`).toBe(true);
        const valid = ["SEM_CICLO_DE_VIDA", "TEXTO_LIVRE", "SENSIVEL_SEM_PROTECAO", "PESSOAL_EM_LOG", "INDICIO_MENOR"];
        for (const f of s.gold.findings) expect(valid).toContain(f.id);
      });
    }
  });
}
