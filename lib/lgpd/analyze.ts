import { parseDdl } from "../sql/parser";
import type { ParseResult } from "../sql/types";
import { aplicarContextoDaTabela, classificarColuna, contextoDaTabela, type ContextoCalculado, type InfoFk } from "./classify";
import { gerarAchados } from "./findings";
import { aplicarCorrecao, type Correcao } from "./manual";
import type { Achado, Analise, AnaliseTabela, ClassificacaoColuna } from "./types";

export interface ResultadoAnalise {
  parse: ParseResult;
  analise: Analise;
}

/** Correções manuais, por "tabela.coluna". */
export type Correcoes = Readonly<Record<string, Correcao>>;

/** Colunas que são chave estrangeira declarada (na própria coluna ou em FOREIGN KEY de tabela): coluna -> tabela referenciada. */
function colunasFk(tabela: ParseResult["tables"][number]): Map<string, string> {
  const m = new Map<string, string>();
  for (const fk of tabela.foreignKeys) for (const c of fk.columns) m.set(c, fk.refTable);
  return m;
}

/** Analisa um resultado de parse. Função pura: mesma entrada, mesma saída. */
export function analisar(parse: ParseResult, correcoes: Correcoes = {}): Analise {
  const tabelas: AnaliseTabela[] = [];
  const achados: Achado[] = [];

  // Contexto de todas as tabelas primeiro: uma FK para tabela de catálogo precisa saber o contexto da outra tabela.
  const contextos = new Map<string, ContextoCalculado>();
  for (const t of parse.tables) contextos.set(t.name, contextoDaTabela(t));

  for (const tabela of parse.tables) {
    const ctx = contextos.get(tabela.name) as ContextoCalculado;
    const fks = colunasFk(tabela);
    const primeira = tabela.columns.map((coluna) => {
      const ref = fks.get(coluna.name);
      const fk: InfoFk | null =
        ref === undefined ? null : { tabelaReferenciada: ref, paraCatalogo: contextos.get(ref)?.tipo === "nao_pessoa" };
      return classificarColuna(tabela, coluna, ctx, undefined, fk);
    });
    const comContexto = aplicarContextoDaTabela(tabela, primeira, ctx, new Set(fks.keys()));
    const colunas: ClassificacaoColuna[] = comContexto.map((auto, i) => {
      const nomeColuna = (tabela.columns[i] as { name: string }).name;
      const correcao = correcoes[`${tabela.name}.${nomeColuna}`];
      return correcao ? aplicarCorrecao(auto, correcao) : auto;
    });
    tabelas.push({ nome: tabela.name, contexto: ctx.tipo, colunas });
    achados.push(...gerarAchados(tabela, colunas, { contexto: ctx.tipo, fkCols: new Set(fks.keys()) }));
  }
  return { tabelas, achados };
}

/** Atalho: texto do DDL -> parse + análise. */
export function analisarDdl(ddl: string, correcoes: Correcoes = {}): ResultadoAnalise {
  const parse = parseDdl(ddl);
  return { parse, analise: analisar(parse, correcoes) };
}
