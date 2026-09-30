import { describe, expect, it } from "vitest";
import { FONTES, fonteExiste } from "../../lib/lgpd/rules/fontes";
import { REGRAS, APELIDOS } from "../../lib/lgpd/rules/pt-br";
import { BASE_LEGAL_POR_CATEGORIA, TECNICAS } from "../../lib/lgpd/rules/protecao";
import { CATEGORIAS, SUBTIPOS_SENSIVEL } from "../../lib/lgpd/types";
import { existsSync } from "node:fs";

describe("regras como dados: integridade", () => {
  it("IDs únicos", () => {
    const ids = REGRAS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("toda regra cita pelo menos uma fonte que existe e tem rótulo", () => {
    for (const r of REGRAS) {
      expect(r.fontes.length, r.id).toBeGreaterThan(0);
      for (const f of r.fontes) expect(fonteExiste(f), `${r.id} -> ${f}`).toBe(true);
      expect(r.rotulo.length, r.id).toBeGreaterThan(1);
    }
  });

  it("toda fonte aponta para um arquivo de pesquisa que existe, com URL e data de acesso", () => {
    for (const [id, f] of Object.entries(FONTES)) {
      expect(existsSync(f.arquivo), `${id}: ${f.arquivo}`).toBe(true);
      expect(f.url).toMatch(/^https:\/\/www\.(planalto|gov)\./);
      expect(f.acessadoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("padrões são tokens minúsculos, sem acento e sem separadores", () => {
    for (const r of REGRAS) {
      expect(r.padroes.length, r.id).toBeGreaterThan(0);
      for (const p of r.padroes) {
        expect(p.length, r.id).toBeGreaterThan(0);
        for (const t of p) expect(t, `${r.id}: "${t}"`).toMatch(/^[a-z0-9]+$/);
      }
    }
  });

  it("padrões são sempre tokens canônicos: nenhum usa uma abreviação que tem apelido", () => {
    for (const r of REGRAS) {
      for (const p of r.padroes) {
        for (const t of p) {
          expect(Object.keys(APELIDOS).includes(t) && APELIDOS[t] !== t, `${r.id}: "${t}" é abreviação de "${APELIDOS[t]}"`).toBe(false);
        }
      }
    }
  });

  it("pesos entre 1 e 10, categorias válidas", () => {
    for (const r of REGRAS) {
      expect(r.peso).toBeGreaterThanOrEqual(1);
      expect(r.peso).toBeLessThanOrEqual(10);
      expect(CATEGORIAS).toContain(r.categoria);
    }
  });

  it("só regra de categoria sensível tem subtipo, e toda regra sensível tem", () => {
    for (const r of REGRAS) {
      if (r.categoria === "sensivel") {
        expect(SUBTIPOS_SENSIVEL, r.id).toContain(r.subtipo);
        expect(r.fontes, r.id).toContain("LGPD-5-II");
      } else {
        expect(r.subtipo, r.id).toBeUndefined();
      }
    }
  });

  it("guarda legal: CPF, RG, CNH, e-mail, endereço, financeiro e nascimento nunca são sensíveis", () => {
    const naoSensiveis = ["idd.cpf", "idd.rg", "idd.cnh", "idd.email", "loc.endereco", "fin.cartao", "fin.renda", "out.nascimento", "out.sexo_genero"];
    for (const id of naoSensiveis) {
      const r = REGRAS.find((x) => x.id === id);
      expect(r, id).toBeDefined();
      expect(r!.categoria, id).not.toBe("sensivel");
    }
  });

  it("regras financeiras explicam 'alto risco, não sensível'", () => {
    for (const r of REGRAS.filter((x) => x.categoria === "financeiro")) {
      expect(r.nota, r.id).toMatch(/alto risco/);
    }
  });

  it("CNPJ é 'depende' e tem nota sobre empresário individual", () => {
    const r = REGRAS.find((x) => x.id === "idd.cnpj")!;
    expect(r.pessoal).toBe("depende");
    expect(r.nota).toMatch(/empresário individual/);
  });
});

describe("sugestões e base legal como dados", () => {
  it("toda técnica diz quando faz sentido, quando não serve e de onde vem", () => {
    for (const t of Object.values(TECNICAS)) {
      expect(t.quando.length).toBeGreaterThan(40);
      expect(t.naoServe.length).toBeGreaterThan(20);
      for (const f of t.fontes) expect(fonteExiste(f)).toBe(true);
    }
  });

  it("hash sem sal avisa que não serve para dado que precisa ser lido", () => {
    expect(TECNICAS.hash_com_sal.naoServe).toMatch(/lido de volta/);
  });

  it("pseudonimização avisa que o dado continua pessoal", () => {
    expect(TECNICAS.pseudonimizacao.naoServe).toMatch(/continua sendo dado pessoal/);
  });

  it("toda base legal é hipótese (nunca afirmação) e cita fonte", () => {
    for (const cat of CATEGORIAS) {
      const b = BASE_LEGAL_POR_CATEGORIA[cat];
      if (cat !== "nao_identificado") expect(b.texto, cat).toMatch(/^Hipótese:/);
      expect(b.fontes.length).toBeGreaterThan(0);
      for (const f of b.fontes) expect(fonteExiste(f)).toBe(true);
    }
  });
});
