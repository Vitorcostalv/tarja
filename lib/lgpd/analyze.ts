import { parseDdl } from "../sql/parser";
import type { ParseResult } from "../sql/types";
import { classificarColuna, contextoDaTabela } from "./classify";
import { gerarAchados } from "./findings";
import { aplicarCorrecao, type Correcao } from "./manual";
import type { Achado, Analise, AnaliseTabela, ClassificacaoColuna } from "./types";

export interface ResultadoAnalise {
  parse: ParseResult;
  analise: Analise;
}

/** Correções manuais, por "tabela.coluna". */
export type Correcoes = Readonly<Record<string, Correcao>>;

/** Analisa um resultado de parse. Função pura: mesma entrada, mesma saída. */
export function analisar(parse: ParseResult, correcoes: Correcoes = {}): Analise {
  const tabelas: AnaliseTabela[] = [];
  const achados: Achado[] = [];

  for (const tabela of parse.tables) {
    const ctx = contextoDaTabela(tabela);
    const colunas: ClassificacaoColuna[] = tabela.columns.map((coluna) => {
      const auto = classificarColuna(tabela, coluna, ctx);
      const correcao = correcoes[`${tabela.name}.${coluna.name}`];
      return correcao ? aplicarCorrecao(auto, correcao) : auto;
    });
    tabelas.push({ nome: tabela.name, contexto: ctx.tipo, colunas });
    achados.push(...gerarAchados(tabela, colunas));
  }
  return { tabelas, achados };
}

/** Atalho: texto do DDL -> parse + análise. */
export function analisarDdl(ddl: string, correcoes: Correcoes = {}): ResultadoAnalise {
  const parse = parseDdl(ddl);
  return { parse, analise: analisar(parse, correcoes) };
}
