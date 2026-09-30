import { describe, expect, it } from "vitest";
import { calcularMetricas, relatorioMarkdown, tabelaMarkdown, type LinhaColuna } from "../../lib/lgpd/metrics";
import type { Categoria } from "../../lib/lgpd/types";

function linha(chave: string, gabarito: Categoria, previsto: Categoria, extra: Partial<LinhaColuna> = {}): LinhaColuna {
  return {
    schema: "s",
    chave,
    gabarito,
    gabaritoSubtipo: null,
    depende: false,
    previsto,
    previstoSubtipo: null,
    previstoPessoal: previsto === "nao_identificado" ? "nao" : "sim",
    confianca: "media",
    motivo: "m",
    ...extra,
  };
}

describe("métricas do corpus", () => {
  const colunas = [
    linha("t.a", "identificador_direto", "identificador_direto"), // VP
    linha("t.b", "identificador_direto", "nao_identificado"), // FN de dado pessoal
    linha("t.c", "nao_identificado", "localizacao"), // FP
    linha("t.d", "nao_identificado", "nao_identificado"),
    linha("t.e", "localizacao", "identificador_direto"), // pessoal nos dois, categoria errada
    linha("t.f", "outro_dado_pessoal", "nao_identificado", { depende: true }), // fora das métricas
    linha("t.g", "sensivel", "sensivel", { gabaritoSubtipo: "saude", previstoSubtipo: "saude" }),
    linha("t.h", "sensivel", "sensivel", { gabaritoSubtipo: "religiao", previstoSubtipo: "politica" }),
  ];
  const m = calcularMetricas(colunas, [{ schema: "s", id: "X", alvo: "t" }, { schema: "s", id: "Y", alvo: "t" }], [{ schema: "s", id: "X", alvo: "t" }, { schema: "s", id: "Z", alvo: "t" }]);

  it("deixa 'depende' de fora de tudo e lista à parte", () => {
    expect(m.totalColunas).toBe(8);
    expect(m.colunasAvaliadas).toBe(7);
    expect(m.colunasDepende).toBe(1);
    expect(m.dependem.map((c) => c.chave)).toEqual(["t.f"]);
  });

  it("métrica binária: pessoal vs não pessoal", () => {
    // gabarito pessoal: a, b, e, g, h (5). previsto pessoal: a, c, e, g, h.
    expect(m.binaria).toMatchObject({ vp: 4, fp: 1, fn: 1, suporte: 5 });
    expect(m.binaria.recall).toBeCloseTo(0.8);
    expect(m.binaria.precisao).toBeCloseTo(0.8);
    expect(m.falsosNegativosPessoais.map((c) => c.chave)).toEqual(["t.b"]);
    expect(m.falsosPositivosPessoais.map((c) => c.chave)).toEqual(["t.c"]);
  });

  it("precisão e recall por categoria", () => {
    const idd = m.porCategoria.find((c) => c.categoria === "identificador_direto")!;
    expect(idd).toMatchObject({ vp: 1, fp: 1, fn: 1, suporte: 2 });
    const nid = m.porCategoria.find((c) => c.categoria === "nao_identificado")!;
    expect(nid.vp).toBe(1);
    const vazia = m.porCategoria.find((c) => c.categoria === "crianca_adolescente")!;
    expect(vazia.precisao).toBeNull();
    expect(vazia.recall).toBeNull();
  });

  it("erros com pessoal nos dois lados e subtipo de sensível", () => {
    expect(m.errosDeCategoria.map((c) => c.chave)).toEqual(["t.e"]);
    expect(m.acertoSubtipoSensivel).toEqual({ certos: 1, total: 2 });
  });

  it("achados: vp, fp, fn por tipo", () => {
    expect(m.achados).toEqual([
      { id: "X", vp: 1, fp: 0, fn: 0, precisao: 1, recall: 1 },
      { id: "Y", vp: 0, fp: 0, fn: 1, precisao: null, recall: 0 },
      { id: "Z", vp: 0, fp: 1, fn: 0, precisao: 0, recall: null },
    ]);
    expect(m.achadosFalsosNegativos.map((a) => a.id)).toEqual(["Y"]);
    expect(m.achadosFalsosPositivos.map((a) => a.id)).toEqual(["Z"]);
  });

  it("markdown: tabela e relatório listam os falsos negativos primeiro", () => {
    expect(tabelaMarkdown(m)).toMatch(/\| Identificador direto \| 2 \|/);
    expect(tabelaMarkdown(m)).toMatch(/Dado pessoal vs não pessoal/);
    const md = relatorioMarkdown("teste", m);
    expect(md.indexOf("Falsos negativos")).toBeLessThan(md.indexOf("Falsos positivos"));
    expect(md).toMatch(/depende/);
    const vazio = relatorioMarkdown("vazio", calcularMetricas([], [], []));
    expect(vazio).toMatch(/Nenhum\./);
  });

  it("conjunto vazio não divide por zero", () => {
    const v = calcularMetricas([], [], []);
    expect(v.binaria.recall).toBeNull();
    expect(v.acertoCategoria).toBe(0);
  });
});
