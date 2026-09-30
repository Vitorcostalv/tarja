# Resultado do corpus: validation

Colunas: 270 (247 avaliadas, 23 com "depende" fora das métricas).
Acerto exato de categoria: 99%.
Subtipo de dado sensível certo: 16 de 17.

| Categoria | Suporte | Precisão | Recall | F1 |
|---|---:|---:|---:|---:|
| Sensível | 17 | 100% | 94% | 97% |
| Criança/adolescente (indício) | 4 | 100% | 100% | 100% |
| Identificador direto | 39 | 98% | 100% | 99% |
| Localização | 27 | 100% | 96% | 98% |
| Financeiro | 14 | 100% | 100% | 100% |
| Outro dado pessoal | 20 | 100% | 100% | 100% |
| Não identificado | 126 | 99% | 100% | 100% |
| **Dado pessoal vs não pessoal** (binária) | 121 | 100% | 99% | 100% |

Contagens da métrica binária: VP 120, FP 0, FN 1. "depende" da Tarja conta como positivo.

## Erros, com os falsos negativos de dado pessoal primeiro

### Falsos negativos de dado pessoal (passou sem marcar) (1)

- `clinica_legado` · `tb_consulta.cd_cid`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (alta). o nome da coluna contém "chave ou código interno"

### Falsos positivos (marcou dado pessoal onde o gabarito diz que não é)

Nenhum.

### Pessoal nos dois lados, categoria errada (1)

- `clinica_legado` · `tb_paciente.nm_cidade`: gabarito **localizacao**, a Tarja disse **identificador_direto** (alta). o nome da coluna contém "nome"; o tipo VARCHAR(60) combina; o nome da tabela "tb_paciente" indica pessoas

## Achados estruturais

| Achado | VP | FP | FN | Precisão | Recall |
|---|---:|---:|---:|---:|---:|
| INDICIO_MENOR | 2 | 0 | 0 | 100% | 100% |
| PESSOAL_EM_LOG | 4 | 0 | 0 | 100% | 100% |
| SEM_CICLO_DE_VIDA | 3 | 2 | 0 | 60% | 100% |
| SENSIVEL_SEM_PROTECAO | 16 | 0 | 1 | 100% | 94% |
| TEXTO_LIVRE | 4 | 0 | 0 | 100% | 100% |

### Achados que faltaram

- `clinica_legado` · SENSIVEL_SEM_PROTECAO · `tb_consulta.cd_cid`

### Achados a mais

- `fintech_opaca` · SEM_CICLO_DE_VIDA · `cad_cliente`
- `fintech_opaca` · SEM_CICLO_DE_VIDA · `mov_financeira`

### Colunas com "depende" no gabarito (fora das métricas) (23)

- `clinica_legado` · `tb_consulta.vl_consulta`: gabarito **financeiro**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `clinica_legado` · `tb_convenio.ds_contato`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `clinica_legado` · `tb_convenio.nr_cnpj`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (media). o nome da coluna contém "CNPJ"
- `clinica_legado` · `tb_paciente.ds_observacao`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `escola_mista` · `frequencia.justificativa`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `escola_mista` · `frequencia.presente`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `fintech_opaca` · `apolices.valor_cobertura`: gabarito **financeiro**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `fintech_opaca` · `cad_cliente.doc`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (alta). o COMMENT da coluna cita "CPF ou CNPJ"
- `fintech_opaca` · `mov_financeira.cod_barras`: gabarito **financeiro**, a Tarja disse **nao_identificado** (alta). o nome da coluna contém "chave ou código interno"
- `fintech_opaca` · `mov_financeira.cpf_cnpj_fav`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (alta). o nome da coluna contém "CPF ou CNPJ"
- `fintech_opaca` · `mov_financeira.hist`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `fintech_opaca` · `tb_log_ws.payload_req`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `marketplace_en` · `orders.customer_notes`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `marketplace_en` · `sellers.contact_email`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (media). o nome da coluna contém "e-mail"; o tipo VARCHAR(190) combina
- `marketplace_en` · `sellers.contact_phone`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (media). o nome da coluna contém "telefone"; o tipo VARCHAR(25) combina
- `marketplace_en` · `sellers.payout_iban`: gabarito **financeiro**, a Tarja disse **financeiro** (media). o nome da coluna contém "conta bancária"
- `marketplace_en` · `sellers.tax_id`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (alta). o COMMENT da coluna cita "CPF ou CNPJ"
- `marketplace_en` · `sessions.token_hash`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `marketplace_en` · `sessions.user_agent`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (alta). o nome da coluna é "identificador de dispositivo"
- `marketplace_en` · `users.password_hash`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `rh_misto` · `beneficios.valor`: gabarito **financeiro**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `rh_misto` · `Empregado.Obs`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `rh_misto` · `tb_ponto_log.batida_em`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
