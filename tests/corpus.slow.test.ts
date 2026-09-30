import { describe, expect, it } from "vitest";
import { loadCorpus } from "../corpus/load";
import { avaliarCorpus } from "../lib/lgpd/corpus-eval";

/**
 * Suíte lenta: roda o classificador sobre os corpora completos.
 *
 * - desenvolvimento: tem PISO de qualidade, para pegar regressão de regra.
 * - validação e externo: só checam que rodam e que as contas fecham. NÃO têm piso, de propósito:
 *   um piso nestes corpora viraria incentivo para ajustar regra olhando para eles.
 *   Os números publicados ficam em docs/results e no README.
 */
describe("corpus de desenvolvimento: piso contra regressão", () => {
  const m = avaliarCorpus(loadCorpus("corpus/dev"));

  it("dado pessoal vs não pessoal: recall alto (deixar passar é pior que marcar a mais)", () => {
    expect(m.binaria.recall ?? 0).toBeGreaterThanOrEqual(0.95);
    expect(m.binaria.precisao ?? 0).toBeGreaterThanOrEqual(0.95);
  });

  it("nenhuma categoria com suporte cai abaixo de 80% de recall", () => {
    for (const c of m.porCategoria) {
      if (c.suporte >= 5) expect(c.recall ?? 0, c.categoria).toBeGreaterThanOrEqual(0.8);
    }
  });

  it("CPF, RG e CNH nunca viram sensível (nuance da lei)", () => {
    const erros = m.errosDeCategoria.filter((c) => /\.(cpf|rg|cnh)$/i.test(c.chave));
    expect(erros).toEqual([]);
  });
});

describe("todos os corpora: as contas fecham", () => {
  for (const nome of ["dev", "validation", "external"]) {
    it(`${nome}: suporte por categoria soma as colunas avaliadas`, () => {
      const m = avaliarCorpus(loadCorpus(`corpus/${nome}`));
      const soma = m.porCategoria.reduce((acc, c) => acc + c.suporte, 0);
      expect(soma).toBe(m.colunasAvaliadas);
      expect(m.colunasAvaliadas + m.colunasDepende).toBe(m.totalColunas);
      expect(m.binaria.vp + m.binaria.fn).toBe(m.binaria.suporte);
    });
  }
});
