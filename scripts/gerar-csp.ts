import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { montarVercelJson } from "../lib/csp";

/**
 * Depois do `next build`: tira os scripts inline das páginas de out/ e os grava como arquivos em
 * out/_next/static/inline/. A CSP então é só `script-src 'self'`: não depende de hash, e o build
 * da Vercel (que pode gerar nomes de arquivo diferentes dos meus) não quebra a página.
 * Ordem e conteúdo dos scripts não mudam, só de onde vêm. Grava também o vercel.json.
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

const PASTA = "out/_next/static/inline";
mkdirSync(PASTA, { recursive: true });

let externalizados = 0;
const arquivos = htmls("out");
if (arquivos.length === 0) {
  console.error("out/ não tem HTML. Rode o next build antes.");
  process.exit(1);
}

for (const arquivo of arquivos) {
  const html = readFileSync(arquivo, "utf8");
  const novo = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (inteiro, atributos: string, corpo: string) => {
    if (/\bsrc\s*=/.test(atributos) || corpo.trim() === "") return inteiro;
    // Só JavaScript executável vira arquivo (bloco de dados como application/json não executa e a CSP não o barra).
    const tipo = /\btype\s*=\s*"([^"]*)"/.exec(atributos)?.[1] ?? "";
    if (tipo !== "" && tipo !== "module" && !/javascript/.test(tipo)) return inteiro;
    const nome = createHash("sha256").update(corpo, "utf8").digest("hex").slice(0, 16) + ".js";
    writeFileSync(join(PASTA, nome), corpo, "utf8");
    externalizados++;
    const src = "/" + relative("out", join(PASTA, nome)).replace(/\\/g, "/");
    const restantes = atributos.replace(/\s+/g, " ").trim();
    return `<script src="${src}"${restantes ? ` ${restantes}` : ""}></script>`;
  });
  if (novo !== html) writeFileSync(arquivo, novo, "utf8");
}

writeFileSync("vercel.json", montarVercelJson(), "utf8");
console.log(`${externalizados} scripts inline viraram arquivos em ${PASTA}; vercel.json gravado (script-src 'self', sem hash).`);
