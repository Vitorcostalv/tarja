import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MEDICAO, fraseDeDesempenho } from "../../lib/lgpd/medicao";

/** A medição publicada tem que ser a registrada: nada de número digitado à mão que destoe da execução. */
describe("medição publicada", () => {
  const linhas = readFileSync("docs/validation-runs-v2.md", "utf8").split("\n").filter((l) => /^\| \d+ \|/.test(l));
  const pct = (texto: string) => Number(texto.replace("%", "").trim()) / 100;
  const linhaDe = (corpus: string) => {
    const l = linhas.find((x) => x.includes(`| ${corpus} |`));
    if (!l) throw new Error(`execução de ${corpus} não registrada`);
    const c = l.split("|").map((x) => x.trim());
    return { precisao: pct(c[5]!), recall: pct(c[6]!), obs: c[8]! };
  };

  it("bate com a execução registrada de cada corpus v2", () => {
    for (const k of ["externo", "validacao"] as const) {
      const registrada = linhaDe(MEDICAO[k].corpus);
      expect(MEDICAO[k].precisao).toBeCloseTo(registrada.precisao, 2);
      expect(MEDICAO[k].recall).toBeCloseTo(registrada.recall, 2);
      expect(registrada.obs).toBe("primeira e única execução");
    }
  });

  it("a frase fixa usa o pior caso e avisa o que 'não identificado' significa", () => {
    const f = fraseDeDesempenho();
    expect(f).toMatch(/cerca de 1 em cada 10 colunas com dado pessoal/);
    expect(f).toMatch(/cerca de 1 em cada 4 colunas que apontou/);
    expect(f).toMatch(/medição v2, uma única execução/);
    expect(f).toMatch(/Não identificado pelas regras/);
  });

  it("os resultados completos existem no repositório", () => {
    for (const f of ["docs/results/validation-v2.md", "docs/results/external-v2.md", "docs/results/historico-de-ajustes.md"]) {
      expect(readFileSync(f, "utf8").length).toBeGreaterThan(200);
    }
  });
});
