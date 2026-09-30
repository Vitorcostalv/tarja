import type { CorpusSchema } from "../../corpus/load";
import { analisarDdl } from "./analyze";
import { calcularMetricas, type LinhaAchado, type LinhaColuna, type Metricas } from "./metrics";
import type { Categoria, ClassificacaoColuna } from "./types";

/** Roda o motor sobre um corpus e compara com o gabarito. Sem I/O. */
export function avaliarCorpus(schemas: readonly CorpusSchema[]): Metricas {
  const colunas: LinhaColuna[] = [];
  const gabaritoAchados: LinhaAchado[] = [];
  const previstoAchados: LinhaAchado[] = [];

  for (const s of schemas) {
    const { analise } = analisarDdl(s.sql);
    const previsto = new Map<string, ClassificacaoColuna>(
      analise.tabelas.flatMap((t) => t.colunas.map((c): [string, ClassificacaoColuna] => [`${c.tabela}.${c.coluna}`, c])),
    );
    for (const g of s.gold.columns) {
      const p = previsto.get(g.key);
      colunas.push({
        schema: s.name,
        chave: g.key,
        gabarito: g.category as Categoria,
        gabaritoSubtipo: g.subtype,
        depende: g.depends,
        previsto: p?.categoria ?? "nao_identificado",
        previstoSubtipo: p?.subtipo ?? null,
        previstoPessoal: p?.pessoal ?? "nao",
        confianca: p?.confianca ?? "baixa",
        motivo: p?.motivo ?? "coluna não encontrada na análise",
      });
    }
    for (const f of s.gold.findings) gabaritoAchados.push({ schema: s.name, id: f.id, alvo: f.target });
    for (const a of analise.achados) {
      previstoAchados.push({ schema: s.name, id: a.id, alvo: a.coluna ? `${a.tabela}.${a.coluna}` : a.tabela });
    }
  }
  return calcularMetricas(colunas, gabaritoAchados, previstoAchados);
}
