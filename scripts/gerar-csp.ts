import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hashDeScript, montarVercelJson, scriptsInline } from "../lib/csp";

/**
 * Depois do `next build`: lê todo HTML de out/, calcula o hash de cada script inline e grava a CSP
 * no vercel.json. Roda como parte de `npm run build`.
 */
function htmls(dir: string): string[] {
  const out: string[] = [];
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) out.push(...htmls(p));
    else if (nome.endsWith(".html")) out.push(p);
  }
  return out;
}

const arquivos = htmls("out");
if (arquivos.length === 0) {
  console.error("out/ não tem HTML. Rode o next build antes.");
  process.exit(1);
}
const hashes = arquivos.flatMap((f) => scriptsInline(readFileSync(f, "utf8")).map(hashDeScript));
writeFileSync("vercel.json", montarVercelJson(hashes), "utf8");
console.log(`vercel.json gravado: ${new Set(hashes).size} hashes de script inline em ${arquivos.length} páginas.`);
