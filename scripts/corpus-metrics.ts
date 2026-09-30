import { mkdirSync, writeFileSync } from "node:fs";
import { loadCorpus } from "../corpus/load";
import { avaliarCorpus } from "../lib/lgpd/corpus-eval";
import { relatorioMarkdown } from "../lib/lgpd/metrics";

/**
 * Uso: npm run corpus:metrics            -> corpus de DESENVOLVIMENTO (pode ajustar regra olhando)
 *      npm run corpus:metrics -- --validacao  -> corpus de VALIDAÇÃO (só em checkpoints; registre a execução)
 *      npm run corpus:metrics -- --externo    -> corpus EXTERNO (schemas de terceiros: Sakila, Employees, WordPress)
 */
const nome = process.argv.includes("--validacao") ? "validation" : process.argv.includes("--externo") ? "external" : "dev";
const metricas = avaliarCorpus(loadCorpus(`corpus/${nome}`));

mkdirSync("docs/results", { recursive: true });
const arquivo = `docs/results/${nome}.md`;
writeFileSync(arquivo, relatorioMarkdown(nome, metricas), "utf8");

const pct = (x: number | null) => (x === null ? "n/d" : `${(x * 100).toFixed(0)}%`);
console.log(`corpus ${nome}: ${metricas.colunasAvaliadas} colunas avaliadas (${metricas.colunasDepende} "depende" fora)`);
console.log(`binária: precisão ${pct(metricas.binaria.precisao)}, recall ${pct(metricas.binaria.recall)} (FN ${metricas.binaria.fn}, FP ${metricas.binaria.fp})`);
for (const c of metricas.porCategoria) {
  console.log(`  ${c.categoria.padEnd(22)} suporte ${String(c.suporte).padStart(3)}  P ${pct(c.precisao).padStart(4)}  R ${pct(c.recall).padStart(4)}`);
}
console.log(`relatório completo em ${arquivo}`);
