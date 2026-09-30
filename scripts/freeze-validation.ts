import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Registra o hash de cada arquivo de um corpus de validação. O teste tests/corpus-frozen.test.ts
 * falha se algum deles mudar. Só rode este script se a mudança no corpus for deliberada,
 * e registre o motivo em docs/results/historico-de-ajustes.md.
 *
 * Uso: tsx scripts/freeze-validation.ts       -> corpus/validation    em docs/validation-frozen.json
 *      tsx scripts/freeze-validation.ts v2    -> corpus/validation-v2 em docs/validation-v2-frozen.json
 */
export function hashes(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of readdirSync(dir).sort()) {
    const texto = readFileSync(join(dir, f), "utf8").replace(/\r\n/g, "\n");
    out[f] = createHash("sha256").update(texto).digest("hex");
  }
  return out;
}

if ((process.argv[1] ?? "").replace(/\\/g, "/").endsWith("scripts/freeze-validation.ts")) {
  const v2 = process.argv.includes("v2");
  const dir = v2 ? "corpus/validation-v2" : "corpus/validation";
  const arquivo = v2 ? "docs/validation-v2-frozen.json" : "docs/validation-frozen.json";
  writeFileSync(arquivo, JSON.stringify(hashes(dir), null, 2) + "\n", "utf8");
  console.log(`hashes de ${dir} gravados em ${arquivo}`);
}
