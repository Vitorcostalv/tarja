import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** O corpus de validação é congelado: qualquer edição derruba este teste. */
describe("corpus de validação congelado", () => {
  const dir = "corpus/validation";
  const esperado = JSON.parse(readFileSync("docs/validation-frozen.json", "utf8")) as Record<string, string>;

  it("nenhum arquivo foi alterado, acrescentado ou removido", () => {
    const atual: Record<string, string> = {};
    for (const f of readdirSync(dir).sort()) {
      const texto = readFileSync(join(dir, f), "utf8").replace(/\r\n/g, "\n");
      atual[f] = createHash("sha256").update(texto).digest("hex");
    }
    expect(atual).toEqual(esperado);
  });
});
