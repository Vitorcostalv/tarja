/**
 * Catálogo das regras "Padrões de DDL v2". Tudo aqui é DADO: a tela lista estas regras para o usuário
 * ler antes de usar, e o verificador (verificar.ts) implementa cada uma pelo id.
 *
 * Estas regras são convenções de equipe definidas pelo autor do projeto (MySQL, charset latin1).
 * Não são lei, não são a LGPD e não foram tiradas de fonte oficial: valem para quem adota o padrão.
 */

export type Modo = "nova" | "legada";
export type Severidade = "erro" | "aviso";

export type AlvoDaRegra = "tabela" | "coluna" | "indice" | "rotina" | "schema" | "comando";

export interface RegraPadrao {
  id: string;
  /** Seção do documento de padrões. */
  secao: string;
  titulo: string;
  /** O que a regra pede e por quê, em português direto. */
  explicacao: string;
  alvo: AlvoDaRegra;
  /** Severidade por modo. Um valor só vale para os dois. */
  severidade: Severidade | { nova: Severidade; legada: Severidade };
}

const ALVO_CONVENCAO = { nova: "erro", legada: "aviso" } as const;

export const SECOES = [
  "1. Estrutura da tabela (tb_)",
  "2. Charset e collation",
  "3. Prefixos de coluna e tipo",
  "4. Defaults",
  "5. Índices e chaves",
  "6. Ordem das colunas",
  "7. Auditoria e multi-tenant",
  "8. Perfil tr_ (snapshot)",
  "9. Perfis _hist e _arc",
  "10. Booleanos",
  "11. Legado a migrar",
  "12. Stored procedures",
  "13. Qualificação de schema",
  "14. Schema dd (inglês)",
  "15. Perfil extensão",
] as const;

export const CATALOGO: readonly RegraPadrao[] = [
  // ---------- 1 ----------
  { id: "E01", secao: SECOES[0], alvo: "tabela", severidade: ALVO_CONVENCAO, titulo: "Nome começa com tb_",
    explicacao: "Tabela de entidade se chama tb_<nome>. Os perfis tr_ (snapshot), _hist, _arc e extensão têm as suas próprias regras." },
  { id: "E02", secao: SECOES[0], alvo: "coluna", severidade: ALVO_CONVENCAO, titulo: "Todos os campos NOT NULL",
    explicacao: "Toda coluna é NOT NULL. Ausência de valor usa um valor-sentinela (ver D03), não NULL. Nas tabelas _hist e _arc a nulidade acompanha a origem." },
  { id: "E03", secao: SECOES[0], alvo: "tabela", severidade: ALVO_CONVENCAO, titulo: "ENGINE=InnoDB",
    explicacao: "Toda tabela declara ENGINE=InnoDB." },
  { id: "E05", secao: SECOES[0], alvo: "tabela", severidade: ALVO_CONVENCAO, titulo: "Sem AUTO_INCREMENT=x no CREATE TABLE",
    explicacao: "O contador do AUTO_INCREMENT não entra na definição da tabela: o valor atual de um ambiente não deve ser copiado para outro." },
  { id: "E06", secao: SECOES[0], alvo: "tabela", severidade: ALVO_CONVENCAO, titulo: "Sem FOREIGN KEY física",
    explicacao: "A integridade referencial é lógica, pela convenção cod_. Não se declara FOREIGN KEY." },
  { id: "E07", secao: SECOES[0], alvo: "coluna", severidade: ALVO_CONVENCAO, titulo: "1ª coluna é a PK cod_<nome>",
    explicacao: "A primeira coluna é a chave primária, chamada cod_<nome-sem-tb_>, int(11) NOT NULL AUTO_INCREMENT." },
  { id: "E08", secao: SECOES[0], alvo: "coluna", severidade: ALVO_CONVENCAO, titulo: "Campo cod_projeto presente",
    explicacao: "Toda entidade tem cod_projeto (chave do multi-tenant). Tabelas de associação N:N e de lookup legadas podem omitir; a ferramenta avisa e você confirma." },
  { id: "E09", secao: SECOES[0], alvo: "coluna", severidade: "aviso", titulo: "tx_descricao é varchar(255)",
    explicacao: "O campo de descrição se chama tx_descricao e é varchar(255)." },
  { id: "E10", secao: SECOES[0], alvo: "coluna", severidade: ALVO_CONVENCAO, titulo: "dt_criacao datetime com DEFAULT CURRENT_TIMESTAMP",
    explicacao: "dt_criacao datetime NOT NULL DEFAULT CURRENT_TIMESTAMP. Em schema dd a variante inglesa é dt_creation." },
  { id: "E11", secao: SECOES[0], alvo: "coluna", severidade: ALVO_CONVENCAO, titulo: "ts_alteracao é a última coluna",
    explicacao: "ts_alteracao timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, sempre a última coluna." },
  // ---------- 2 ----------
  { id: "C01", secao: SECOES[1], alvo: "tabela", severidade: "aviso", titulo: "Charset latin1",
    explicacao: "O alvo é DEFAULT CHARSET=latin1 (latin1_swedish_ci, acento e caixa insensíveis, bom para busca em português). utf8mb4 destoa. Colunas js_ (JSON) ficam utf8mb4 por imposição do tipo e não são reportadas. Atenção: latin1 não guarda emoji nem aspas tipográficas." },
  { id: "C02", secao: SECOES[1], alvo: "coluna", severidade: "aviso", titulo: "Sem COLLATE explícito",
    explicacao: "Não declare COLLATE na tabela nem nas colunas: a collation é a herdada do charset." },
  // ---------- 3 ----------
  { id: "P01", secao: SECOES[2], alvo: "coluna", severidade: ALVO_CONVENCAO, titulo: "Tipo combina com o prefixo",
    explicacao: "cod_ int(11) · nu_/nu_secs_/nu_milis_ numérico · vl_ decimal(12,2) · pc_ numérico · qt_ int ou float · cnpj_/cpf_ texto(20) · en_ enum · nm_ varchar(100/150/200/250) · tx_ texto · js_ JSON · dt_ date ou datetime · dh_ datetime · ts_ timestamp · hr_ time." },
  { id: "P02", secao: SECOES[2], alvo: "coluna", severidade: ALVO_CONVENCAO, titulo: "Prefixo combina com o tipo",
    explicacao: "enum pede en_, timestamp pede ts_, TIME (hora sem data) pede hr_." },
  { id: "P03", secao: SECOES[2], alvo: "coluna", severidade: ALVO_CONVENCAO, titulo: "Campos de controle padronizados",
    explicacao: "dt_criacao/dt_creation é DATETIME com DEFAULT CURRENT_TIMESTAMP; ts_alteracao é TIMESTAMP. Não use dt_alteracao do tipo timestamp (legado): o correto é ts_alteracao." },
  // ---------- 4 ----------
  { id: "D01", secao: SECOES[3], alvo: "coluna", severidade: "aviso", titulo: "varchar NOT NULL DEFAULT ''",
    explicacao: "Coluna varchar NOT NULL leva DEFAULT ''." },
  { id: "D02", secao: SECOES[3], alvo: "coluna", severidade: "aviso", titulo: "vl_ com DEFAULT '0.00'",
    explicacao: "Coluna monetária vl_ leva DEFAULT '0.00'." },
  { id: "D03", secao: SECOES[3], alvo: "coluna", severidade: "aviso", titulo: "Datetime e hora 'sem valor' usam sentinela",
    explicacao: "Datetime sem valor: NOT NULL DEFAULT '0000-00-00 00:00:00'. Hora pura (hr_): NOT NULL DEFAULT '00:00:00'. O sentinela substitui o NULL." },
  { id: "D04", secao: SECOES[3], alvo: "coluna", severidade: "aviso", titulo: "FK (cod_) sem DEFAULT '0'",
    explicacao: "FK é NOT NULL sem DEFAULT. O valor 0 ('sem vínculo') continua válido, mas é escrito de propósito no INSERT, nunca assumido por default: sem default, esquecer a coluna falha em vez de gravar 0 sem ninguém ver. Isso só vale com sql_mode estrito (STRICT_TRANS_TABLES ou STRICT_ALL_TABLES)." },
  { id: "D05", secao: SECOES[3], alvo: "coluna", severidade: "erro", titulo: "cod_projeto nunca leva DEFAULT",
    explicacao: "cod_projeto int(11) NOT NULL, sem DEFAULT. Zero nunca é um tenant válido: um INSERT que esqueça a coluna não pode virar uma linha órfã em silêncio." },
  // ---------- 5 ----------
  { id: "I01", secao: SECOES[4], alvo: "indice", severidade: "aviso", titulo: "Índices começam com i_",
    explicacao: "Índices, únicos ou não, se chamam i_<colunas>: KEY i_x e UNIQUE KEY i_x." },
  { id: "I02", secao: SECOES[4], alvo: "tabela", severidade: "aviso", titulo: "No máximo 5 índices secundários",
    explicacao: "Cada índice encarece todo INSERT, UPDATE e DELETE e ocupa disco. Acima de 5 (fora a PK), confira se alguma consulta realmente usa cada um." },
  { id: "I03", secao: SECOES[4], alvo: "indice", severidade: "aviso", titulo: "Sem índice de coluna única redundante",
    explicacao: "Um KEY de uma coluna só raramente é o acesso que o otimizador quer, e (cod_projeto, x) cobre a mesma busca já escopada por tenant. Exceções: a PK e o índice de uma FK cod_X criado para join." },
  { id: "I04", secao: SECOES[4], alvo: "indice", severidade: "aviso", titulo: "UNIQUE de negócio escopado por cod_projeto",
    explicacao: "Um UNIQUE sobre uma coluna só, sem cod_projeto, impõe unicidade global: dois projetos não poderiam repetir o valor. O UNIQUE de negócio é composto e começa por cod_projeto." },
  // ---------- 6 ----------
  { id: "O01", secao: SECOES[5], alvo: "tabela", severidade: "aviso", titulo: "Ordem canônica das colunas",
    explicacao: "cod_<pk> → cod_projeto → demais cod_ (FKs) → nm_ → tx_descricao → dt_criacao → campos de negócio → flag_/en_ → ts_alteracao." },
  // ---------- 7 ----------
  { id: "A01", secao: SECOES[6], alvo: "comando", severidade: "erro", titulo: "cod_projeto é imutável",
    explicacao: "cod_projeto só entra em INSERT e em WHERE. Nunca no SET de um UPDATE nem como alvo de ON DUPLICATE KEY UPDATE: isso move a linha de um tenant para outro e, sem FK física, os filhos não acompanham. Única exceção, desencorajada: re-chavear a tabela-raiz de tenant (tb_projeto) numa rotina dedicada." },
  // ---------- 8 ----------
  { id: "R01", secao: SECOES[7], alvo: "tabela", severidade: ALVO_CONVENCAO, titulo: "Perfil tr_ (snapshot / telemetria)",
    explicacao: "Prefixo tr_, sem PRIMARY KEY e sem AUTO_INCREMENT. Identidade por UNIQUE KEY uk_<tabela>_1dia (cod_<entidade>, dt_referencia). No fim: dt_referencia date NOT NULL e dt_carga datetime NOT NULL DEFAULT CURRENT_TIMESTAMP." },
  // ---------- 9 ----------
  { id: "H01", secao: SECOES[8], alvo: "tabela", severidade: ALVO_CONVENCAO, titulo: "Nome e schema do histórico",
    explicacao: "tb_<nome>_hist, no schema da origem com sufixo _hist (origem em app_crm → histórico em app_crm_hist)." },
  { id: "H02", secao: SECOES[8], alvo: "coluna", severidade: ALVO_CONVENCAO, titulo: "Cabeçalho do _hist",
    explicacao: "As 4 primeiras colunas: cod_<nome>_hist (PK autonumerada), cod_user_create_hist int(11) NOT NULL, cod_processo int(11) NOT NULL e dt_criacao_hist datetime NOT NULL DEFAULT CURRENT_TIMESTAMP. Depois vêm todos os campos da origem." },
  { id: "H03", secao: SECOES[8], alvo: "coluna", severidade: ALVO_CONVENCAO, titulo: "ts_alteracao no _hist",
    explicacao: "ts_alteracao é campo próprio do perfil, sempre a última coluna: trilha de adulteração, preenchida pelo DEFAULT, nunca por valor da origem." },
  { id: "H04", secao: SECOES[8], alvo: "coluna", severidade: "aviso", titulo: "Colunas de origem do _hist sem DEFAULT",
    explicacao: "As colunas herdadas da origem são NOT NULL sem DEFAULT: a rotina de histórico preenche todas via SELECT, então um default nunca é usado e só esconderia uma coluna esquecida." },
  { id: "H05", secao: SECOES[8], alvo: "tabela", severidade: ALVO_CONVENCAO, titulo: "Perfil _arc (archive)",
    explicacao: "tb_<nome>_arc no schema de histórico, com os mesmos 4 campos de cabeçalho do _hist. Guarda o estado final de linhas removidas." },
  // ---------- 10 ----------
  { id: "B01", secao: SECOES[9], alvo: "coluna", severidade: ALVO_CONVENCAO, titulo: "Sim/Não é enum en_",
    explicacao: "O alvo para Sim/Não é enum com prefixo en_ (valores Proper Case). O flag_ tinyint(1) é legado aceito em tabela legada." },
  { id: "B02", secao: SECOES[9], alvo: "coluna", severidade: "aviso", titulo: "Valores de enum em Proper Case, sem acento",
    explicacao: "Valores de en_ em Proper Case e sem acento: Sim, Nao, Em Andamento." },
  // ---------- 11 ----------
  { id: "L01", secao: SECOES[10], alvo: "coluna", severidade: "aviso", titulo: "Legado a migrar",
    explicacao: "e_ → en_ · cod_ int(10) unsigned → int(11) · num_ → nu_ · valor_ → vl_ decimal(12,2) · tx_desc → tx_descricao varchar(255) · tb_hist_<nome> → tb_<nome>_hist." },
  // ---------- 12 ----------
  { id: "S01", secao: SECOES[11], alvo: "rotina", severidade: ALVO_CONVENCAO, titulo: "DEFINER = root@localhost",
    explicacao: "Toda procedure, function, trigger e event usa DEFINER=`root`@`localhost`. Um definer pessoal prende a rotina a uma conta que pode ser desativada, trocar de senha ou mudar de host. Rotina nova ou alterada com definer pessoal é erro; rotina legada ainda não tocada é aviso." },
  { id: "S02", secao: SECOES[11], alvo: "rotina", severidade: "aviso", titulo: "Nome sp_[função]_[tabela]",
    explicacao: "Procedures se chamam sp_<função>_<tabela> (criar, apagar, alterar, ativar, desativar, bloquear), sp_<tabela>_hist, sp_<tabela>_arc ou sp_<rotina>_lock." },
  { id: "S03", secao: SECOES[11], alvo: "rotina", severidade: "erro", titulo: "Escrita em tabela versionada chama o histórico",
    explicacao: "Rotina que faz INSERT, UPDATE ou DELETE numa tabela com _hist chama sp_<tabela>_hist (ou _arc no DELETE). UPDATE: depois da operação. INSERT: depois de capturar o LAST_INSERT_ID(). A chamada é qualificada: CALL <schema>_hist.sp_<tabela>_hist(...)." },
  { id: "S04", secao: SECOES[11], alvo: "rotina", severidade: "aviso", titulo: "INSERT com LAST_INSERT_ID e ROW_COUNT",
    explicacao: "No INSERT (ou upsert), capture o LAST_INSERT_ID() e condicione o histórico a ROW_COUNT() > 0, para não gravar histórico quando nada mudou." },
  { id: "S05", secao: SECOES[11], alvo: "rotina", severidade: "erro", titulo: "DELETE: arquivar antes, com guarda EXISTS",
    explicacao: "Na rotina de DELETE: (1) chame sp_<tabela>_arc enquanto a linha ainda existe; (2) só então faça o DELETE, condicionado a um EXISTS que confirme a linha já presente na tabela _arc. Sem o EXISTS, se o archive falhar o DELETE apaga e o dado se perde." },
  { id: "S06", secao: SECOES[11], alvo: "rotina", severidade: "aviso", titulo: "Rotina de comando único",
    explicacao: "Rotina cujo corpo é um único INSERT, UPDATE, DELETE ou SELECT quase sempre pulou as obrigações desta seção (histórico, ROW_COUNT, archive). Vira erro quando escreve numa tabela versionada sem chamar o histórico. sp_<tabela>_hist e sp_<tabela>_arc são exceção." },
  { id: "S07", secao: SECOES[11], alvo: "rotina", severidade: "aviso", titulo: "Rotinas de histórico no schema _hist",
    explicacao: "sp_<tabela>_hist e sp_<tabela>_arc moram no schema de histórico (sufixo _hist)." },
  { id: "S08", secao: SECOES[11], alvo: "rotina", severidade: "aviso", titulo: "Wrapper de lock (sp_<rotina>_lock)",
    explicacao: "O wrapper adquire GET_LOCK('sp_<rotina>_lock', 0) (string igual ao nome do wrapper), sai com LEAVE se não conseguir, chama a rotina, libera com RELEASE_LOCK e tem EXIT HANDLER que libera e faz RESIGNAL em erro." },
  // ---------- 13 ----------
  { id: "Q01", secao: SECOES[12], alvo: "comando", severidade: "aviso", titulo: "Referências qualificadas pelo schema",
    explicacao: "Toda tabela ou rotina vem com o schema: schema.tb_x, schema.sp_x. Referência sem schema resolve pelo schema padrão da conexão e pode atingir o objeto errado. Mesmo schema → aviso; objeto de outro schema (chamadas _hist e _arc) → erro." },
  // ---------- 14 ----------
  { id: "G01", secao: SECOES[13], alvo: "schema", severidade: "aviso", titulo: "No schema dd, identificadores em inglês",
    explicacao: "No schema dd nomes de tabela, coluna, rotina e valores de enum são em inglês. Os prefixos (cod_, nm_, dt_...) continuam; traduz-se o que vem depois. Todas as outras regras valem igual." },
  // ---------- 15 ----------
  { id: "X01", secao: SECOES[14], alvo: "tabela", severidade: "aviso", titulo: "Perfil extensão (estende 1:1 uma tb_ raiz)",
    explicacao: "A PK é herdada da raiz, sem AUTO_INCREMENT. Não tem dt_criacao (é a da raiz). Mantém ts_alteracao e cod_projeto sem DEFAULT. Mora no mesmo schema da raiz." },
];

export function regraPorId(id: string): RegraPadrao | undefined {
  return CATALOGO.find((r) => r.id === id);
}

export function severidadeDa(regra: RegraPadrao, modo: Modo): Severidade {
  return typeof regra.severidade === "string" ? regra.severidade : regra.severidade[modo];
}
