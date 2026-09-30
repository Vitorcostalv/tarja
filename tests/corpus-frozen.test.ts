import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Os corpora de validação são congelados: qualquer edição derruba este teste. */
const CONGELADOS: Array<[string, string]> = [
  ["corpus/validation", "docs/validation-frozen.json"],
  ["corpus/validation-v2", "docs/validation-v2-frozen.json"],
];

for (const [dir, registro] of CONGELADOS) {
  describe(`${dir} congelado`, () => {
    const esperado = JSON.parse(readFileSync(registro, "utf8")) as Record<string, string>;

    it("nenhum arquivo foi alterado, acrescentado ou removido", () => {
      const atual: Record<string, string> = {};
      for (const f of readdirSync(dir).sort()) {
        const texto = readFileSync(join(dir, f), "utf8").replace(/\r\n/g, "\n");
        atual[f] = createHash("sha256").update(texto).digest("hex");
      }
      expect(atual).toEqual(esperado);
    });
  });
}
