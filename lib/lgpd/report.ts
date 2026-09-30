import { DICIONARIO } from "./classify";
import { VERSAO_REGRAS, VOCAB_FORA_DO_CONTEXTO } from "./rules/pt-br";
import { tokens as tokensDe } from "./text";
import { BASE_LEGAL_POR_CATEGORIA, FINALIDADE_PADRAO, RETENCAO_PADRAO, TECNICAS, sugerirProtecao } from "./rules/protecao";
import type { Achado, Analise, Categoria, Confianca, Pessoal } from "./types";

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

/** Nomes de categoria para tela e relatório. "Não identificado" sempre diz que é das regras. */
export const ROTULO_CATEGORIA: Readonly<Record<Categoria, string>> = {
  identificador_direto: "Identificador direto",
  localizacao: "Localização",
  financeiro: "Financeiro",
  crianca_adolescente: "Criança/adolescente (indício)",
  sensivel: "Sensível",
  outro_dado_pessoal: "Outro dado pessoal",
  nao_identificado: "Não identificado pelas regras",
};

export function rotuloCategoria(codigo: string): string {
  return (ROTULO_CATEGORIA as Record<string, string>)[codigo] ?? codigo;
}

/** Chave, data de sistema, credencial, estado ou booleano: nunca é o "dado pessoal escondido" que a revisão procura. */
export function colunaDeSistema(coluna: string, tipoSql: string): boolean {
  if (/^(tinyint\(1\)|bool|boolean|bit)/i.test(tipoSql.trim())) return true;
  return tokensDe(coluna, DICIONARIO).some((t) => VOCAB_FORA_DO_CONTEXTO.has(t));
}

/**
 * Colunas em que nenhuma regra casou (fora as de sistema, que a revisão não precisa olhar). "Não identificado pelas regras" quer dizer "a Tarja não achou pista",
 * não "não tem dado pessoal": o usuário precisa revisar estas.
 */
export function colunasSemClassificacao(analise: Analise): Array<{ tabela: string; coluna: string; tipoSql: string }> {
  const out: Array<{ tabela: string; coluna: string; tipoSql: string }> = [];
  for (const t of analise.tabelas) {
    for (const c of t.colunas) {
      if (c.origem === "regra" && c.ruleId === null && c.categoria === "nao_identificado" && !colunaDeSistema(c.coluna, c.tipoSql)) {
        out.push({ tabela: c.tabela, coluna: c.coluna, tipoSql: c.tipoSql });
      }
    }
  }
  return out;
}

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
  /** Nenhuma regra casou com esta coluna: é "não identificado pelas regras" por falta de pista. */
  semRegra: boolean;
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
        semRegra: c.origem === "regra" && c.ruleId === null,
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
  /** Colunas sem nenhuma regra: revise. */
  semClassificacao: number;
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
    semClassificacao: r.linhas.filter((l) => l.semRegra && l.categoria === "nao_identificado" && !colunaDeSistema(l.coluna, l.tipoSql)).length,
  };
}
