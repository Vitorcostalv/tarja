import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Contraste WCAG dos tokens do DESIGN.md, calculado a partir do CSS de verdade. */
const css = readFileSync("app/globals.css", "utf8");
const token = (nome: string): string => {
  const m = new RegExp(`--color-${nome}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!m) throw new Error(`token ${nome} não encontrado`);
  return m[1]!;
};
function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
function contraste(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

describe("design: contraste AA dos tokens", () => {
  const papel = token("papel");
  it("texto sobre papel", () => {
    expect(contraste(token("tinta"), papel)).toBeGreaterThanOrEqual(7);
    expect(contraste(token("tinta-suave"), papel)).toBeGreaterThanOrEqual(7);
    expect(contraste(token("mudo"), papel)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(token("sinal-texto"), papel)).toBeGreaterThanOrEqual(4.5);
  });
  it("texto sobre a faixa de apoio (papel-2): o laranja de texto NÃO pode ser usado aqui", () => {
    const p2 = token("papel-2");
    expect(contraste(token("tinta"), p2)).toBeGreaterThanOrEqual(7);
    expect(contraste(token("mudo"), p2)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(token("sinal-texto"), p2)).toBeLessThan(4.5);
  });
  it("contorno de componente: 3:1 sobre o papel", () => {
    expect(contraste(token("linha"), papel)).toBeGreaterThanOrEqual(3);
    expect(contraste(token("tinta-suave"), papel)).toBeGreaterThanOrEqual(3);
  });
  it("tarja e laranja: papel sobre tarja e laranja sobre tarja legíveis quando a tarja se revela", () => {
    expect(contraste(papel, token("tarja"))).toBeGreaterThanOrEqual(7);
    expect(contraste(token("sinal"), token("tarja"))).toBeGreaterThanOrEqual(4.5);
    expect(contraste(token("tinta"), token("sinal"))).toBeGreaterThanOrEqual(4.5);
  });
});

describe("design: regras do DESIGN.md no CSS", () => {
  it("a cor de destaque só aparece em regras de dado sensível", () => {
    const blocos = css.split("}").filter((b) => /var\(--color-sinal(-texto)?\)/.test(b));
    expect(blocos.length).toBeGreaterThan(0);
    for (const b of blocos) {
      const seletor = b.split("{")[0]!.trim();
      expect(seletor, `uso de laranja fora de "sensível": ${seletor}`).toMatch(/sensivel|\.resumo \.sinal/);
    }
  });

  it("sem sombra difusa, gradiente, blur nem raio de borda", () => {
    expect(css).not.toMatch(/gradient\(/);
    expect(css).not.toMatch(/backdrop-filter|blur\(/);
    expect(css).not.toMatch(/box-shadow:[^;]*\d+px\s+\d+px\s+\d+px\s+(?!var\()/); // nada de sombra com desfoque
    expect(css).not.toMatch(/border-radius:\s*(?!0)[1-9]/);
  });

  it("impressão: a tarja nunca esconde o conteúdo e o relatório aparece", () => {
    const impressao = css.slice(css.indexOf("@media print"));
    expect(impressao).toMatch(/\.tarja[\s\S]*background:\s*transparent\s*!important/);
    expect(impressao).toMatch(/\.tarja[\s\S]*color:\s*#000\s*!important/);
    expect(impressao).toMatch(/\.relatorio[\s\S]*display:\s*block\s*!important/);
  });

  it("movimento: transição só sem prefers-reduced-motion:reduce", () => {
    const trechos = css.split(/@media/).filter((t) => /transition/.test(t));
    expect(trechos.length).toBeGreaterThan(0);
    for (const t of trechos) expect(t.trimStart()).toMatch(/^\(prefers-reduced-motion:\s*no-preference\)/);
  });

  it("modo de contraste forçado e contraste alto têm tratamento", () => {
    expect(css).toMatch(/@media \(forced-colors: active\)/);
    expect(css).toMatch(/@media \(prefers-contrast: more\)/);
  });

  it("foco visível em tudo", () => {
    expect(css).toMatch(/:focus-visible\s*{[^}]*box-shadow:\s*var\(--foco\)/);
  });

  it("fontes são as três do DESIGN.md, todas self-hosted (nenhuma URL externa no CSS)", () => {
    expect(css).toMatch(/Barlow Condensed/);
    expect(css).toMatch(/Source Serif 4/);
    expect(css).toMatch(/IBM Plex Mono/);
    expect(css).not.toMatch(/https?:\/\//);
    expect(css).not.toMatch(/@import url/);
  });
});
