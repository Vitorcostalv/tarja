import { CATEGORIAS, type Categoria } from "./types";

/**
 * Métricas do corpus: precisão e recall por categoria, métrica binária (pessoal vs não pessoal)
 * e achados estruturais. Função pura, sem I/O. O script scripts/corpus-metrics.ts faz a leitura.
 *
 * Colunas com "depende" (?) no gabarito ficam FORA de todas as métricas e são listadas à parte.
 */

export interface LinhaColuna {
  schema: string;
  chave: string; // tabela.coluna
  gabarito: Categoria;
  gabaritoSubtipo: string | null;
  depende: boolean;
  previsto: Categoria;
  previstoSubtipo: string | null;
  previstoPessoal: "sim" | "nao" | "depende";
  confianca: "alta" | "media" | "baixa";
  motivo: string;
}

export interface LinhaAchado {
  schema: string;
  id: string;
  alvo: string;
}

export interface MetricaCategoria {
  categoria: Categoria;
  suporte: number;
  vp: number;
  fp: number;
  fn: number;
  precisao: number | null;
  recall: number | null;
  f1: number | null;
}

export interface Metricas {
  totalColunas: number;
  colunasAvaliadas: number;
  colunasDepende: number;
  porCategoria: MetricaCategoria[];
  binaria: MetricaCategoria;
  acertoCategoria: number;
  acertoSubtipoSensivel: { certos: number; total: number };
  falsosNegativosPessoais: LinhaColuna[];
  falsosPositivosPessoais: LinhaColuna[];
  errosDeCategoria: LinhaColuna[];
  dependem: LinhaColuna[];
  achados: Array<{ id: string; vp: number; fp: number; fn: number; precisao: number | null; recall: number | null }>;
  achadosFalsosNegativos: LinhaAchado[];
  achadosFalsosPositivos: LinhaAchado[];
}

const SUBTIPO_GABARITO_PARA_CODIGO: Record<string, string> = {
  racial: "racial_etnica",
  religiao: "religiao",
  politica: "politica",
  sindical: "sindical",
  saude: "saude",
  vida_sexual: "vida_sexual",
  genetico: "genetico",
  biometrico: "biometrico",
};

function razao(n: number, d: number): number | null {
  return d === 0 ? null : n / d;
}

function f1(p: number | null, r: number | null): number | null {
  if (p === null || r === null) return null;
  return p + r === 0 ? 0 : (2 * p * r) / (p + r);
}

function metrica(categoria: Categoria, vp: number, fp: number, fn: number): MetricaCategoria {
  const precisao = razao(vp, vp + fp);
  const recall = razao(vp, vp + fn);
  return { categoria, suporte: vp + fn, vp, fp, fn, precisao, recall, f1: f1(precisao, recall) };
}

export function calcularMetricas(
  colunas: readonly LinhaColuna[],
  achadosGabarito: readonly LinhaAchado[],
  achadosPrevistos: readonly LinhaAchado[],
): Metricas {
  const avaliadas = colunas.filter((c) => !c.depende);

  const porCategoria = CATEGORIAS.map((cat) => {
    let vp = 0;
    let fp = 0;
    let fn = 0;
    for (const c of avaliadas) {
      if (c.gabarito === cat && c.previsto === cat) vp++;
      else if (c.previsto === cat) fp++;
      else if (c.gabarito === cat) fn++;
    }
    return metrica(cat, vp, fp, fn);
  });

  // Binária: "é dado pessoal?". O que a ferramenta marca como "depende" conta como positivo,
  // porque deixar passar dado pessoal é pior do que marcar a mais.
  let bvp = 0;
  let bfp = 0;
  let bfn = 0;
  const falsosNegativos: LinhaColuna[] = [];
  const falsosPositivos: LinhaColuna[] = [];
  for (const c of avaliadas) {
    const gabPessoal = c.gabarito !== "nao_identificado";
    const prevPessoal = c.previstoPessoal !== "nao";
    if (gabPessoal && prevPessoal) bvp++;
    else if (!gabPessoal && prevPessoal) {
      bfp++;
      falsosPositivos.push(c);
    } else if (gabPessoal && !prevPessoal) {
      bfn++;
      falsosNegativos.push(c);
    }
  }

  let acertos = 0;
  const erros: LinhaColuna[] = [];
  let subCertos = 0;
  let subTotal = 0;
  for (const c of avaliadas) {
    if (c.gabarito === c.previsto) acertos++;
    else if (c.gabarito !== "nao_identificado" && c.previsto !== "nao_identificado") erros.push(c);
    if (c.gabarito === "sensivel") {
      subTotal++;
      const esperado = c.gabaritoSubtipo ? SUBTIPO_GABARITO_PARA_CODIGO[c.gabaritoSubtipo] : null;
      if (c.previsto === "sensivel" && c.previstoSubtipo === esperado) subCertos++;
    }
  }

  const chaveAchado = (a: LinhaAchado) => `${a.schema}|${a.id}|${a.alvo}`;
  const gab = new Set(achadosGabarito.map(chaveAchado));
  const prev = new Set(achadosPrevistos.map(chaveAchado));
  const ids = [...new Set([...achadosGabarito, ...achadosPrevistos].map((a) => a.id))].sort();
  const achados = ids.map((id) => {
    const g = achadosGabarito.filter((a) => a.id === id).map(chaveAchado);
    const p = achadosPrevistos.filter((a) => a.id === id).map(chaveAchado);
    const vp = g.filter((k) => prev.has(k)).length;
    const fp = p.filter((k) => !gab.has(k)).length;
    const fn = g.filter((k) => !prev.has(k)).length;
    return { id, vp, fp, fn, precisao: razao(vp, vp + fp), recall: razao(vp, vp + fn) };
  });

  const ordem = (a: LinhaColuna, b: LinhaColuna) => a.schema.localeCompare(b.schema) || a.chave.localeCompare(b.chave);

  return {
    totalColunas: colunas.length,
    colunasAvaliadas: avaliadas.length,
    colunasDepende: colunas.length - avaliadas.length,
    porCategoria,
    binaria: metrica("identificador_direto", bvp, bfp, bfn),
    acertoCategoria: razao(acertos, avaliadas.length) ?? 0,
    acertoSubtipoSensivel: { certos: subCertos, total: subTotal },
    falsosNegativosPessoais: falsosNegativos.sort(ordem),
    falsosPositivosPessoais: falsosPositivos.sort(ordem),
    errosDeCategoria: erros.sort(ordem),
    dependem: colunas.filter((c) => c.depende).sort(ordem),
    achados,
    achadosFalsosNegativos: achadosGabarito.filter((a) => !prev.has(chaveAchado(a))),
    achadosFalsosPositivos: achadosPrevistos.filter((a) => !gab.has(chaveAchado(a))),
  };
}

const pct = (x: number | null) => (x === null ? "n/d" : `${(x * 100).toFixed(0)}%`);

const NOME_CATEGORIA: Record<Categoria, string> = {
  sensivel: "Sensível",
  crianca_adolescente: "Criança/adolescente (indício)",
  identificador_direto: "Identificador direto",
  localizacao: "Localização",
  financeiro: "Financeiro",
  outro_dado_pessoal: "Outro dado pessoal",
  nao_identificado: "Não identificado",
};

export function tabelaMarkdown(m: Metricas): string {
  const linhas = [
    "| Categoria | Suporte | Precisão | Recall | F1 |",
    "|---|---:|---:|---:|---:|",
    ...m.porCategoria.map(
      (c) => `| ${NOME_CATEGORIA[c.categoria]} | ${c.suporte} | ${pct(c.precisao)} | ${pct(c.recall)} | ${pct(c.f1)} |`,
    ),
    `| **Dado pessoal vs não pessoal** (binária) | ${m.binaria.suporte} | ${pct(m.binaria.precisao)} | ${pct(m.binaria.recall)} | ${pct(m.binaria.f1)} |`,
  ];
  return linhas.join("\n");
}

function listaColunas(titulo: string, itens: readonly LinhaColuna[], limite = 200): string {
  if (itens.length === 0) return `### ${titulo}\n\nNenhum.\n`;
  const corpo = itens
    .slice(0, limite)
    .map(
      (c) =>
        `- \`${c.schema}\` · \`${c.chave}\`: gabarito **${c.gabarito}${c.gabaritoSubtipo ? `:${c.gabaritoSubtipo}` : ""}**, a Tarja disse **${c.previsto}** (${c.confianca}). ${c.motivo}`,
    )
    .join("\n");
  return `### ${titulo} (${itens.length})\n\n${corpo}\n`;
}

export function relatorioMarkdown(nome: string, m: Metricas): string {
  const f = (a: LinhaAchado) => `- \`${a.schema}\` · ${a.id} · \`${a.alvo}\``;
  return [
    `# Resultado do corpus: ${nome}`,
    "",
    `Colunas: ${m.totalColunas} (${m.colunasAvaliadas} avaliadas, ${m.colunasDepende} com "depende" fora das métricas).`,
    `Acerto exato de categoria: ${pct(m.acertoCategoria)}.`,
    `Subtipo de dado sensível certo: ${m.acertoSubtipoSensivel.certos} de ${m.acertoSubtipoSensivel.total}.`,
    "",
    tabelaMarkdown(m),
    "",
    "Contagens da métrica binária: " +
      `VP ${m.binaria.vp}, FP ${m.binaria.fp}, FN ${m.binaria.fn}. "depende" da Tarja conta como positivo.`,
    "",
    "## Erros, com os falsos negativos de dado pessoal primeiro",
    "",
    listaColunas("Falsos negativos de dado pessoal (passou sem marcar)", m.falsosNegativosPessoais),
    listaColunas("Falsos positivos (marcou dado pessoal onde o gabarito diz que não é)", m.falsosPositivosPessoais),
    listaColunas("Pessoal nos dois lados, categoria errada", m.errosDeCategoria),
    "## Achados estruturais",
    "",
    "| Achado | VP | FP | FN | Precisão | Recall |",
    "|---|---:|---:|---:|---:|---:|",
    ...m.achados.map((a) => `| ${a.id} | ${a.vp} | ${a.fp} | ${a.fn} | ${pct(a.precisao)} | ${pct(a.recall)} |`),
    "",
    "### Achados que faltaram",
    "",
    ...(m.achadosFalsosNegativos.length ? m.achadosFalsosNegativos.map(f) : ["Nenhum."]),
    "",
    "### Achados a mais",
    "",
    ...(m.achadosFalsosPositivos.length ? m.achadosFalsosPositivos.map(f) : ["Nenhum."]),
    "",
    listaColunas('Colunas com "depende" no gabarito (fora das métricas)', m.dependem),
  ].join("\n");
}
