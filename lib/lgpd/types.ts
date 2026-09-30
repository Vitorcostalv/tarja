/** Tipos do motor LGPD. Tudo aqui é dado puro: sem DOM, sem React, sem relógio, sem aleatoriedade. */

export const CATEGORIAS = [
  "sensivel",
  "crianca_adolescente",
  "identificador_direto",
  "localizacao",
  "financeiro",
  "outro_dado_pessoal",
  "nao_identificado",
] as const;

/** Ordem de desempate quando duas regras marcam a mesma pontuação: a primeira vence. */
export type Categoria = (typeof CATEGORIAS)[number];

export const SUBTIPOS_SENSIVEL = [
  "racial_etnica",
  "religiao",
  "politica",
  "sindical",
  "saude",
  "vida_sexual",
  "genetico",
  "biometrico",
] as const;
export type SubtipoSensivel = (typeof SUBTIPOS_SENSIVEL)[number];

export type Confianca = "alta" | "media" | "baixa";

/** "depende" = pode ou não ser dado pessoal conforme o caso (ex.: CNPJ de empresário individual). */
export type Pessoal = "sim" | "nao" | "depende";

/** Família do tipo SQL, para checar se o tipo combina com a regra. */
export type FamiliaTipo = "texto" | "texto_longo" | "numero" | "data" | "binario" | "booleano";

export type ContextoTabela =
  | "pessoa"
  | "nao_pessoa"
  | "neutro"
  | "endereco"
  | "log"
  | "cartao"
  | "conta"
  | "financeiro"
  | "saude"
  | "responsavel";

export interface Regra {
  id: string;
  categoria: Categoria;
  subtipo?: SubtipoSensivel;
  /** Sequências de tokens canônicos. Basta uma casar (contíguas, na ordem). */
  padroes: string[][];
  /** Peso intrínseco: 7 = termo inequívoco, 4 = termo ambíguo que precisa de ajuda do contexto. */
  peso: number;
  tipos?: FamiliaTipo[];
  pessoal?: Pessoal;
  /** Bônus (ou penalidade, se negativo) por contexto da tabela. */
  contexto?: Partial<Record<ContextoTabela, number>>;
  /** Só vale se o nome da coluna for exatamente o padrão (ex.: "conta", mas não "tipo_conta"). */
  exata?: boolean;
  /** Entra na decisão "esta tabela é de pessoas?". */
  evidenciaPessoa?: boolean;
  /** Frase curta usada no motivo: "cpf", "data de nascimento". */
  rotulo: string;
  /** IDs das fontes em docs/research (ex.: LGPD-5-II). Obrigatório. */
  fontes: string[];
  nota?: string;
}

export interface SinalMotivo {
  tipo: "nome" | "comentario" | "tipo" | "tabela";
  texto: string;
}

export interface ClassificacaoColuna {
  tabela: string;
  coluna: string;
  tipoSql: string;
  categoria: Categoria;
  subtipo: SubtipoSensivel | null;
  pessoal: Pessoal;
  /** Dado sensível pelo art. 5º, II (lista fechada). CPF, RG e dado financeiro NÃO entram. */
  sensivel: boolean;
  /** Dado financeiro: não é sensível pela lei, mas é de alto risco. */
  altoRisco: boolean;
  confianca: Confianca;
  motivo: string;
  ruleId: string | null;
  /** Pontuação que decidiu. Útil para auditar; não aparece no relatório. */
  pontuacao: number;
  fontes: string[];
  nota: string | null;
  /** Nome/COMMENT/tipo indicam alguma proteção já aplicada (hash, cript, binário). */
  protecaoAparente: boolean;
  origem: "regra" | "manual";
}

export type Gravidade = "alta" | "media" | "baixa";

export interface Achado {
  id: string;
  gravidade: Gravidade;
  tabela: string;
  coluna: string | null;
  titulo: string;
  explicacao: string;
  fontes: string[];
}

export interface AnaliseTabela {
  nome: string;
  contexto: ContextoTabela;
  colunas: ClassificacaoColuna[];
}

export interface Analise {
  tabelas: AnaliseTabela[];
  achados: Achado[];
}
