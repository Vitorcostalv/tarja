import { VERSAO_REGRAS } from "./rules/pt-br";
import { BASE_LEGAL_POR_CATEGORIA, FINALIDADE_PADRAO, RETENCAO_PADRAO, TECNICAS, sugerirProtecao } from "./rules/protecao";
import type { Achado, Analise, Confianca, Pessoal } from "./types";

/**
 * Relatório de mapeamento: rascunho do inventário das operações de tratamento (LGPD, art. 37)
 * e insumo para o RIPD (art. 38). Não é o documento final.
 * Nada aqui lê relógio nem gera aleatoriedade: a data, se houver, vem de fora.
 */

export const RELATORIO_VERSAO = 1;

export const AVISO =
  "Rascunho de inventário das operações de tratamento e insumo para o RIPD. Não é parecer jurídico e não substitui advogado nem DPO. " +
  "A classificação vem de regras sobre o nome, o tipo e o comentário das colunas (não é IA): dá para auditar cada decisão, mas ela erra. " +
  "A base legal é só hipótese. Finalidade e retenção dependem do negócio e são do controlador.";

export interface LinhaRelatorio {
  tabela: string;
  coluna: string;
  tipoSql: string;
  categoria: string;
  subtipo: string | null;
  sensivel: boolean;
  pessoal: Pessoal;
  altoRisco: boolean;
  confianca: Confianca;
  motivo: string;
  origem: "regra" | "manual";
  /** Campo para o controlador preencher. Começa vazio. */
  finalidade: string;
  /** Sempre marcada como hipótese. */
  baseLegal: string;
  /** "a definir pelo controlador" enquanto o usuário não preencher. Nunca inventamos prazo. */
  retencao: string;
  protecao: string[];
  nota: string | null;
}

export interface Relatorio {
  versao: number;
  regras: string;
  aviso: string;
  /** Data informada de fora (ISO). null quando não informada. */
  geradoEm: string | null;
  linhas: LinhaRelatorio[];
  achados: Achado[];
}

export interface Preenchimento {
  finalidade?: string;
  retencao?: string;
}

export interface OpcoesRelatorio {
  geradoEm?: string | null;
  /** Por "tabela.coluna". */
  preenchimentos?: Readonly<Record<string, Preenchimento>>;
}

export function gerarRelatorio(analise: Analise, opcoes: OpcoesRelatorio = {}): Relatorio {
  const linhas: LinhaRelatorio[] = [];
  for (const t of analise.tabelas) {
    for (const c of t.colunas) {
      const pre = opcoes.preenchimentos?.[`${c.tabela}.${c.coluna}`];
      const protecao = sugerirProtecao(c).map((s) => `${TECNICAS[s.tecnica].nome}: ${s.dica}`);
      linhas.push({
        tabela: c.tabela,
        coluna: c.coluna,
        tipoSql: c.tipoSql,
        categoria: c.categoria,
        subtipo: c.subtipo,
        sensivel: c.sensivel,
        pessoal: c.pessoal,
        altoRisco: c.altoRisco,
        confianca: c.confianca,
        motivo: c.motivo,
        origem: c.origem,
        finalidade: pre?.finalidade?.trim() ? pre.finalidade : FINALIDADE_PADRAO,
        baseLegal: c.pessoal === "nao" ? BASE_LEGAL_POR_CATEGORIA.nao_identificado.texto : BASE_LEGAL_POR_CATEGORIA[c.categoria].texto,
        retencao: pre?.retencao?.trim() ? pre.retencao : RETENCAO_PADRAO,
        protecao,
        nota: c.nota,
      });
    }
  }
  return {
    versao: RELATORIO_VERSAO,
    regras: VERSAO_REGRAS,
    aviso: AVISO,
    geradoEm: opcoes.geradoEm ?? null,
    linhas,
    achados: analise.achados,
  };
}

export interface Resumo {
  tabelas: number;
  colunas: number;
  pessoais: number;
  dependem: number;
  sensiveis: number;
  altoRisco: number;
  corrigidasAMao: number;
  achados: number;
}

export function resumir(r: Relatorio): Resumo {
  const tabelas = new Set(r.linhas.map((l) => l.tabela));
  return {
    tabelas: tabelas.size,
    colunas: r.linhas.length,
    pessoais: r.linhas.filter((l) => l.pessoal === "sim").length,
    dependem: r.linhas.filter((l) => l.pessoal === "depende").length,
    sensiveis: r.linhas.filter((l) => l.sensivel).length,
    altoRisco: r.linhas.filter((l) => l.altoRisco).length,
    corrigidasAMao: r.linhas.filter((l) => l.origem === "manual").length,
    achados: r.achados.length,
  };
}
