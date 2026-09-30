import { execSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { loadCorpus } from "../corpus/load";
import { avaliarCorpus } from "../lib/lgpd/corpus-eval";
import { relatorioMarkdown } from "../lib/lgpd/metrics";

/**
 * Uso: npm run corpus:metrics                    -> desenvolvimento (pode ajustar regra olhando)
 *      npm run corpus:metrics -- --externo       -> externo v1 (Sakila, Employees, WordPress): agora também desenvolvimento
 *      npm run corpus:metrics -- --validacao     -> validação v1 (queimada: agora também desenvolvimento)
 *      npm run corpus:metrics -- --validacao-v2  -> validação v2: UMA ÚNICA execução, registrada
 *      npm run corpus:metrics -- --externo-v2    -> externo v2 (Northwind, Chinook, OpenEMR): UMA ÚNICA execução, registrada
 *
 * Os corpora v2 recusam a segunda execução. Para repetir de propósito, passe --reexecutar: a repetição
 * fica registrada como tal e o corpus deixa de valer como validação.
 */
const ARGS = process.argv.slice(2);
const CORPORA: Record<string, { pasta: string; unico: boolean }> = {
  "--validacao-v2": { pasta: "validation-v2", unico: true },
  "--externo-v2": { pasta: "external-v2", unico: true },
  "--validacao": { pasta: "validation", unico: false },
  "--externo": { pasta: "external", unico: false },
};
const escolhido = Object.keys(CORPORA).find((f) => ARGS.includes(f));
const { pasta: nome, unico } = escolhido ? (CORPORA[escolhido] as { pasta: string; unico: boolean }) : { pasta: "dev", unico: false };

const REGISTRO_V2 = "docs/validation-runs-v2.md";
const CABECALHO_V2 = [
  "# Execuções dos corpora v2 (validação e externo)",
  "",
  "Estes corpora foram escritos e congelados antes das mudanças de regra que eles avaliam, e cada um roda **uma única vez**.",
  "Uma segunda execução (`--reexecutar`) fica registrada como tal e tira o valor de validação do corpus.",
  "",
  "| # | Corpus | Data | Commit | Precisão binária | Recall binário | FN de dado pessoal | Observação |",
  "|---:|---|---|---|---:|---:|---:|---|",
  "",
].join("\n");

function linhasRegistradas(): string[] {
  return existsSync(REGISTRO_V2) ? readFileSync(REGISTRO_V2, "utf8").split("\n").filter((l) => /^\| \d+ \|/.test(l)) : [];
}

if (unico && !ARGS.includes("--reexecutar") && linhasRegistradas().some((l) => l.includes(`| ${nome} |`))) {
  console.error(`O corpus ${nome} já foi executado (ver ${REGISTRO_V2}). Ele vale como validação uma única vez.`);
  process.exit(1);
}

const metricas = avaliarCorpus(loadCorpus(`corpus/${nome}`));

mkdirSync("docs/results", { recursive: true });
const arquivo = `docs/results/${nome}.md`;
writeFileSync(arquivo, relatorioMarkdown(nome, metricas), "utf8");

const pct = (x: number | null) => (x === null ? "n/d" : `${(x * 100).toFixed(0)}%`);
console.log(`corpus ${nome}: ${metricas.colunasAvaliadas} colunas avaliadas (${metricas.colunasDepende} "depende" fora)`);
console.log(
  `binária: precisão ${pct(metricas.binaria.precisao)}, recall ${pct(metricas.binaria.recall)} (FN ${metricas.binaria.fn}, FP ${metricas.binaria.fp})`,
);
for (const c of metricas.porCategoria) {
  console.log(
    `  ${c.categoria.padEnd(22)} suporte ${String(c.suporte).padStart(3)}  P ${pct(c.precisao).padStart(4)}  R ${pct(c.recall).padStart(4)}`,
  );
}
console.log(`relatório completo em ${arquivo}`);

function commitAtual(): string {
  try {
    let c = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
    if (execSync("git status --porcelain lib corpus", { encoding: "utf8" }).trim() !== "") c += " (+alterações não commitadas)";
    return c;
  } catch {
    return "desconhecido";
  }
}

// Validação v1: registro antigo, mantido.
if (nome === "validation") {
  const registro = "docs/validation-runs.md";
  const numeradas = readFileSync(registro, "utf8")
    .split("\n")
    .filter((l) => /^\| \d+ \|/.test(l));
  const n = numeradas.length + 1;
  appendFileSync(
    registro,
    `| ${n} | ${new Date().toISOString().slice(0, 10)} | ${commitAtual()} | ${pct(metricas.binaria.recall)} | ${pct(metricas.binaria.precisao)} | ${metricas.binaria.fn} |\n`,
    "utf8",
  );
  console.log(`execução ${n} da validação v1 registrada em ${registro}`);
}

if (unico) {
  if (!existsSync(REGISTRO_V2)) writeFileSync(REGISTRO_V2, CABECALHO_V2, "utf8");
  const n = linhasRegistradas().length + 1;
  const obs = ARGS.includes("--reexecutar") ? "REEXECUÇÃO: não vale mais como validação" : "primeira e única execução";
  appendFileSync(
    REGISTRO_V2,
    `| ${n} | ${nome} | ${new Date().toISOString().slice(0, 10)} | ${commitAtual()} | ${pct(metricas.binaria.precisao)} | ${pct(metricas.binaria.recall)} | ${metricas.binaria.fn} | ${obs} |\n`,
    "utf8",
  );
  console.log(`execução ${n} de ${nome} registrada em ${REGISTRO_V2}`);
}
