import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Registra o hash de cada arquivo do corpus de validação. O teste tests/corpus-frozen.test.ts
 * falha se algum deles mudar. Só rode este script se a mudança no corpus for deliberada,
 * e registre o motivo em docs/results/historico-de-ajustes.md.
 */
export function hashes(dir = "corpus/validation"): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of readdirSync(dir).sort()) {
    const texto = readFileSync(join(dir, f), "utf8").replace(/\r\n/g, "\n");
    out[f] = createHash("sha256").update(texto).digest("hex");
  }
  return out;
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("scripts/freeze-validation.ts")) {
  writeFileSync("docs/validation-frozen.json", JSON.stringify(hashes(), null, 2) + "\n", "utf8");
  console.log("hashes do corpus de validação gravados em docs/validation-frozen.json");
}
