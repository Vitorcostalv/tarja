import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { documentoDosPadroes } from "../../scripts/gerar-doc-padroes";

describe("documento dos padrões", () => {
  it("docs/padroes-ddl-v2.md é exatamente o que o catálogo gera (rode npm run doc:padroes)", () => {
    const esperado = documentoDosPadroes();
    const atual = readFileSync("docs/padroes-ddl-v2.md", "utf8").replace(/\r\n/g, "\n");
    expect(atual).toBe(esperado);
  });
  it("diz com todas as letras que não é LGPD e lista as lacunas", () => {
    const d = documentoDosPadroes();
    expect(d).toMatch(/Não são a LGPD, não são lei/);
    expect(d).toMatch(/Lacunas conhecidas/);
    expect(d).not.toMatch(/vtt|max\.silva/i);
  });
});
