// Serve out/ com os mesmos cabeçalhos do vercel.json, para conferir a CSP localmente.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const projeto = join(dirname(fileURLToPath(import.meta.url)), "..");

const porta = Number(process.env.PORT ?? 4173);
const raiz = join(projeto, "out");
const config = JSON.parse(readFileSync(join(projeto, "vercel.json"), "utf8"));
const cabecalhos = Object.fromEntries(config.headers[0].headers.map((h) => [h.key, h.value]));
const tipos = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".woff2": "font/woff2", ".woff": "font/woff", ".svg": "image/svg+xml", ".png": "image/png", ".txt": "text/plain; charset=utf-8", ".json": "application/json" };

createServer((req, res) => {
  let caminho = normalize(decodeURIComponent((req.url ?? "/").split("?")[0])).replace(/^[/\\]+/, "");
  if (caminho === "" || caminho.endsWith("/")) caminho += "index.html";
  let arquivo = join(raiz, caminho);
  if (!arquivo.startsWith(raiz)) { res.writeHead(403).end(); return; }
  if (!existsSync(arquivo) || statSync(arquivo).isDirectory()) {
    if (existsSync(arquivo + ".html")) arquivo += ".html";
    else { res.writeHead(404, { ...cabecalhos, "Content-Type": tipos[".html"] }).end(readFileSync(join(raiz, "404.html"))); return; }
  }
  res.writeHead(200, { ...cabecalhos, "Content-Type": tipos[extname(arquivo)] ?? "application/octet-stream" }).end(readFileSync(arquivo));
}).listen(porta, () => console.log(`http://localhost:${porta}`));
