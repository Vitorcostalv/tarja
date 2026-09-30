# Padrões de DDL (v2)

> Gerado de `lib/ddl/catalogo.ts` por `npm run doc:padroes`. Não edite à mão: edite o catálogo.

Convenções de DDL para MySQL definidas pelo **autor do projeto** (charset latin1, multi-tenant por `cod_projeto`). Não são a LGPD, não são lei e não vêm de fonte oficial: valem para quem adota o padrão.

## Como o verificador reporta

| Severidade | Significado |
|---|---|
| ERRO | Não roda, quebra, ou viola convenção obrigatória. |
| AVISO | Convenção ou boa prática que depende de intenção, ou item legado a migrar. |

**Tabela nova × legada.** Várias regras têm dois alvos. No modo *legada*, itens de migração são aviso; no modo *nova*, os mesmos itens são erro. O modo é escolhido na tela ou, em automático, deduzido do charset (`latin1` = legada, `utf8mb4` = nova), e a tela diz qual foi assumido.

## 1. Estrutura da tabela (tb_)

### E01: Nome começa com tb_

*Severidade: erro em tabela nova, aviso em legada.*

Tabela de entidade se chama tb_<nome>. Os perfis tr_ (snapshot), _hist, _arc e extensão têm as suas próprias regras.

### E02: Todos os campos NOT NULL

*Severidade: erro em tabela nova, aviso em legada.*

Toda coluna é NOT NULL. Ausência de valor usa um valor-sentinela (ver D03), não NULL. Nas tabelas _hist e _arc a nulidade acompanha a origem.

### E03: ENGINE=InnoDB

*Severidade: erro em tabela nova, aviso em legada.*

Toda tabela declara ENGINE=InnoDB.

### E05: Sem AUTO_INCREMENT=x no CREATE TABLE

*Severidade: erro em tabela nova, aviso em legada.*

O contador do AUTO_INCREMENT não entra na definição da tabela: o valor atual de um ambiente não deve ser copiado para outro.

### E06: Sem FOREIGN KEY física

*Severidade: erro em tabela nova, aviso em legada.*

A integridade referencial é lógica, pela convenção cod_. Não se declara FOREIGN KEY.

### E07: 1ª coluna é a PK cod_<nome>

*Severidade: erro em tabela nova, aviso em legada.*

A primeira coluna é a chave primária, chamada cod_<nome-sem-tb_>, int(11) NOT NULL AUTO_INCREMENT.

### E08: Campo cod_projeto presente

*Severidade: erro em tabela nova, aviso em legada.*

Toda entidade tem cod_projeto (chave do multi-tenant). Tabelas de associação N:N e de lookup legadas podem omitir; a ferramenta avisa e você confirma.

### E09: tx_descricao é varchar(255)

*Severidade: aviso.*

O campo de descrição se chama tx_descricao e é varchar(255).

### E10: dt_criacao datetime com DEFAULT CURRENT_TIMESTAMP

*Severidade: erro em tabela nova, aviso em legada.*

dt_criacao datetime NOT NULL DEFAULT CURRENT_TIMESTAMP. Em schema dd a variante inglesa é dt_creation.

### E11: ts_alteracao é a última coluna

*Severidade: erro em tabela nova, aviso em legada.*

ts_alteracao timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, sempre a última coluna.

## 2. Charset e collation

### C01: Charset latin1

*Severidade: aviso.*

O alvo é DEFAULT CHARSET=latin1 (latin1_swedish_ci, acento e caixa insensíveis, bom para busca em português). utf8mb4 destoa. Colunas js_ (JSON) ficam utf8mb4 por imposição do tipo e não são reportadas. Atenção: latin1 não guarda emoji nem aspas tipográficas.

### C02: Sem COLLATE explícito

*Severidade: aviso.*

Não declare COLLATE na tabela nem nas colunas: a collation é a herdada do charset.

## 3. Prefixos de coluna e tipo

### P01: Tipo combina com o prefixo

*Severidade: erro em tabela nova, aviso em legada.*

cod_ int(11) · nu_/nu_secs_/nu_milis_ numérico · vl_ decimal(12,2) · pc_ numérico · qt_ int ou float · cnpj_/cpf_ texto(20) · en_ enum · nm_ varchar(100/150/200/250) · tx_ texto · js_ JSON · dt_ date ou datetime · dh_ datetime · ts_ timestamp · hr_ time.

### P02: Prefixo combina com o tipo

*Severidade: erro em tabela nova, aviso em legada.*

enum pede en_, timestamp pede ts_, TIME (hora sem data) pede hr_.

### P03: Campos de controle padronizados

*Severidade: erro em tabela nova, aviso em legada.*

dt_criacao/dt_creation é DATETIME com DEFAULT CURRENT_TIMESTAMP; ts_alteracao é TIMESTAMP. Não use dt_alteracao do tipo timestamp (legado): o correto é ts_alteracao.

## 4. Defaults

### D01: varchar NOT NULL DEFAULT ''

*Severidade: aviso.*

Coluna varchar NOT NULL leva DEFAULT ''.

### D02: vl_ com DEFAULT '0.00'

*Severidade: aviso.*

Coluna monetária vl_ leva DEFAULT '0.00'.

### D03: Datetime e hora 'sem valor' usam sentinela

*Severidade: aviso.*

Datetime sem valor: NOT NULL DEFAULT '0000-00-00 00:00:00'. Hora pura (hr_): NOT NULL DEFAULT '00:00:00'. O sentinela substitui o NULL.

### D04: FK (cod_) sem DEFAULT '0'

*Severidade: aviso.*

FK é NOT NULL sem DEFAULT. O valor 0 ('sem vínculo') continua válido, mas é escrito de propósito no INSERT, nunca assumido por default: sem default, esquecer a coluna falha em vez de gravar 0 sem ninguém ver. Isso só vale com sql_mode estrito (STRICT_TRANS_TABLES ou STRICT_ALL_TABLES).

### D05: cod_projeto nunca leva DEFAULT

*Severidade: erro.*

cod_projeto int(11) NOT NULL, sem DEFAULT. Zero nunca é um tenant válido: um INSERT que esqueça a coluna não pode virar uma linha órfã em silêncio.

## 5. Índices e chaves

### I01: Índices começam com i_

*Severidade: aviso.*

Índices, únicos ou não, se chamam i_<colunas>: KEY i_x e UNIQUE KEY i_x.

### I02: No máximo 5 índices secundários

*Severidade: aviso.*

Cada índice encarece todo INSERT, UPDATE e DELETE e ocupa disco. Acima de 5 (fora a PK), confira se alguma consulta realmente usa cada um.

### I03: Sem índice de coluna única redundante

*Severidade: aviso.*

Um KEY de uma coluna só raramente é o acesso que o otimizador quer, e (cod_projeto, x) cobre a mesma busca já escopada por tenant. Exceções: a PK e o índice de uma FK cod_X criado para join.

### I04: UNIQUE de negócio escopado por cod_projeto

*Severidade: aviso.*

Um UNIQUE sobre uma coluna só, sem cod_projeto, impõe unicidade global: dois projetos não poderiam repetir o valor. O UNIQUE de negócio é composto e começa por cod_projeto.

## 6. Ordem das colunas

### O01: Ordem canônica das colunas

*Severidade: aviso.*

cod_<pk> → cod_projeto → demais cod_ (FKs) → nm_ → tx_descricao → dt_criacao → campos de negócio → flag_/en_ → ts_alteracao.

## 7. Auditoria e multi-tenant

### A01: cod_projeto é imutável

*Severidade: erro.*

cod_projeto só entra em INSERT e em WHERE. Nunca no SET de um UPDATE nem como alvo de ON DUPLICATE KEY UPDATE: isso move a linha de um tenant para outro e, sem FK física, os filhos não acompanham. Única exceção, desencorajada: re-chavear a tabela-raiz de tenant (tb_projeto) numa rotina dedicada.

## 8. Perfil tr_ (snapshot)

### R01: Perfil tr_ (snapshot / telemetria)

*Severidade: erro em tabela nova, aviso em legada.*

Prefixo tr_, sem PRIMARY KEY e sem AUTO_INCREMENT. Identidade por UNIQUE KEY uk_<tabela>_1dia (cod_<entidade>, dt_referencia). No fim: dt_referencia date NOT NULL e dt_carga datetime NOT NULL DEFAULT CURRENT_TIMESTAMP.

## 9. Perfis _hist e _arc

### H01: Nome e schema do histórico

*Severidade: erro em tabela nova, aviso em legada.*

tb_<nome>_hist, no schema da origem com sufixo _hist (origem em app_crm → histórico em app_crm_hist).

### H02: Cabeçalho do _hist

*Severidade: erro em tabela nova, aviso em legada.*

As 4 primeiras colunas: cod_<nome>_hist (PK autonumerada), cod_user_create_hist int(11) NOT NULL, cod_processo int(11) NOT NULL e dt_criacao_hist datetime NOT NULL DEFAULT CURRENT_TIMESTAMP. Depois vêm todos os campos da origem.

### H03: ts_alteracao no _hist

*Severidade: erro em tabela nova, aviso em legada.*

ts_alteracao é campo próprio do perfil, sempre a última coluna: trilha de adulteração, preenchida pelo DEFAULT, nunca por valor da origem.

### H04: Colunas de origem do _hist sem DEFAULT

*Severidade: aviso.*

As colunas herdadas da origem são NOT NULL sem DEFAULT: a rotina de histórico preenche todas via SELECT, então um default nunca é usado e só esconderia uma coluna esquecida.

### H05: Perfil _arc (archive)

*Severidade: erro em tabela nova, aviso em legada.*

tb_<nome>_arc no schema de histórico, com os mesmos 4 campos de cabeçalho do _hist. Guarda o estado final de linhas removidas.

## 10. Booleanos

### B01: Sim/Não é enum en_

*Severidade: erro em tabela nova, aviso em legada.*

O alvo para Sim/Não é enum com prefixo en_ (valores Proper Case). O flag_ tinyint(1) é legado aceito em tabela legada.

### B02: Valores de enum em Proper Case, sem acento

*Severidade: aviso.*

Valores de en_ em Proper Case e sem acento: Sim, Nao, Em Andamento.

## 11. Legado a migrar

### L01: Legado a migrar

*Severidade: aviso.*

e_ → en_ · cod_ int(10) unsigned → int(11) · num_ → nu_ · valor_ → vl_ decimal(12,2) · tx_desc → tx_descricao varchar(255) · tb_hist_<nome> → tb_<nome>_hist.

## 12. Stored procedures

### S01: DEFINER = root@localhost

*Severidade: erro em tabela nova, aviso em legada.*

Toda procedure, function, trigger e event usa DEFINER=`root`@`localhost`. Um definer pessoal prende a rotina a uma conta que pode ser desativada, trocar de senha ou mudar de host. Rotina nova ou alterada com definer pessoal é erro; rotina legada ainda não tocada é aviso.

### S02: Nome sp_[função]_[tabela]

*Severidade: aviso.*

Procedures se chamam sp_<função>_<tabela> (criar, apagar, alterar, ativar, desativar, bloquear), sp_<tabela>_hist, sp_<tabela>_arc ou sp_<rotina>_lock.

### S03: Escrita em tabela versionada chama o histórico

*Severidade: erro.*

Rotina que faz INSERT, UPDATE ou DELETE numa tabela com _hist chama sp_<tabela>_hist (ou _arc no DELETE). UPDATE: depois da operação. INSERT: depois de capturar o LAST_INSERT_ID(). A chamada é qualificada: CALL <schema>_hist.sp_<tabela>_hist(...).

### S04: INSERT com LAST_INSERT_ID e ROW_COUNT

*Severidade: aviso.*

No INSERT (ou upsert), capture o LAST_INSERT_ID() e condicione o histórico a ROW_COUNT() > 0, para não gravar histórico quando nada mudou.

### S05: DELETE: arquivar antes, com guarda EXISTS

*Severidade: erro.*

Na rotina de DELETE: (1) chame sp_<tabela>_arc enquanto a linha ainda existe; (2) só então faça o DELETE, condicionado a um EXISTS que confirme a linha já presente na tabela _arc. Sem o EXISTS, se o archive falhar o DELETE apaga e o dado se perde.

### S06: Rotina de comando único

*Severidade: aviso.*

Rotina cujo corpo é um único INSERT, UPDATE, DELETE ou SELECT quase sempre pulou as obrigações desta seção (histórico, ROW_COUNT, archive). Vira erro quando escreve numa tabela versionada sem chamar o histórico. sp_<tabela>_hist e sp_<tabela>_arc são exceção.

### S07: Rotinas de histórico no schema _hist

*Severidade: aviso.*

sp_<tabela>_hist e sp_<tabela>_arc moram no schema de histórico (sufixo _hist).

### S08: Wrapper de lock (sp_<rotina>_lock)

*Severidade: aviso.*

O wrapper adquire GET_LOCK('sp_<rotina>_lock', 0) (string igual ao nome do wrapper), sai com LEAVE se não conseguir, chama a rotina, libera com RELEASE_LOCK e tem EXIT HANDLER que libera e faz RESIGNAL em erro.

## 13. Qualificação de schema

### Q01: Referências qualificadas pelo schema

*Severidade: aviso.*

Toda tabela ou rotina vem com o schema: schema.tb_x, schema.sp_x. Referência sem schema resolve pelo schema padrão da conexão e pode atingir o objeto errado. Mesmo schema → aviso; objeto de outro schema (chamadas _hist e _arc) → erro.

## 14. Schema dd (inglês)

### G01: No schema dd, identificadores em inglês

*Severidade: aviso.*

No schema dd nomes de tabela, coluna, rotina e valores de enum são em inglês. Os prefixos (cod_, nm_, dt_...) continuam; traduz-se o que vem depois. Todas as outras regras valem igual.

## 15. Perfil extensão

### X01: Perfil extensão (estende 1:1 uma tb_ raiz)

*Severidade: aviso.*

A PK é herdada da raiz, sem AUTO_INCREMENT. Não tem dt_criacao (é a da raiz). Mantém ts_alteracao e cod_projeto sem DEFAULT. Mora no mesmo schema da raiz.

## Lacunas conhecidas (o que o verificador NÃO consegue saber)

- **Chave opcional × obrigatória (D04):** o DDL não diz se uma FK `cod_` é opcional; `DEFAULT '0'` numa FK é sempre aviso. Só `cod_projeto` é erro.
- **Associação N:N e lookup legada (E08):** a ferramenta avisa que falta `cod_projeto` e você confirma.
- **Tabela versionada (S03 a S05):** a ferramenta só sabe que uma tabela tem histórico se a `tb_<nome>_hist` estiver no mesmo script. Sem ela, a ausência de chamada ao histórico vira aviso, não erro.
- **Qualificação de schema (Q01):** só confere nomes que começam com `tb_`, `tr_` ou `sp_`. Não sabe qual é o schema padrão da sessão, então referência sem schema a objeto do mesmo schema é aviso.
- **Schema `dd` em inglês (G01):** usa uma lista pequena de palavras em português. Palavra fora da lista passa.
- **Perfil extensão (X01):** a ferramenta não adivinha qual tabela é extensão: você informa nas opções (`tb_site_gf:tb_site`).
- **`sql_mode` (D04):** a regra só vale com modo estrito no servidor; o DDL não mostra isso.
- **Repertório latin1 (C01):** não dá para saber, pelo DDL, se a aplicação grava emoji ou aspas tipográficas.
- **Não implementado:** o par denormalizado `cod_X` + `X` e o uso dominante de `dh_` (§11), e o `ALTER TABLE` (só `CREATE`, `UPDATE`, `INSERT`, `DELETE`, `CALL` e rotinas são lidos).
- **Leitura de rotinas:** o leitor acha comandos de escrita, chamadas e `DEFINER` por heurística de tokens, não por um parser completo de SQL procedural. Corpo muito incomum pode escapar.
