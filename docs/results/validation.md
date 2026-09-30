# Resultado do corpus: validation

Colunas: 270 (247 avaliadas, 23 com "depende" fora das métricas).
Acerto exato de categoria: 95%.
Subtipo de dado sensível certo: 17 de 17.

| Categoria | Suporte | Precisão | Recall | F1 |
|---|---:|---:|---:|---:|
| Sensível | 17 | 94% | 100% | 97% |
| Criança/adolescente (indício) | 4 | 100% | 100% | 100% |
| Identificador direto | 39 | 100% | 100% | 100% |
| Localização | 27 | 100% | 100% | 100% |
| Financeiro | 14 | 100% | 100% | 100% |
| Outro dado pessoal | 20 | 65% | 100% | 78% |
| Não identificado | 126 | 100% | 90% | 95% |
| **Dado pessoal vs não pessoal** (binária) | 121 | 91% | 100% | 95% |

Contagens da métrica binária: VP 121, FP 12, FN 0. "depende" da Tarja conta como positivo.

## Erros, com os falsos negativos de dado pessoal primeiro

### Falsos negativos de dado pessoal (passou sem marcar)

Nenhum.

### Falsos positivos (marcou dado pessoal onde o gabarito diz que não é) (12)

- `clinica_legado` · `tb_paciente.dt_cadastro`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "tb_paciente" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `clinica_legado` · `tb_vacina.cd_vacina`: gabarito **nao_identificado**, a Tarja disse **sensivel** (media). o nome da coluna contém "saúde"
- `escola_mista` · `mensalidades.competencia`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "mensalidades" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `escola_mista` · `mensalidades.forma_pagamento`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "mensalidades" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `escola_mista` · `mensalidades.pago_em`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "mensalidades" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `escola_mista` · `mensalidades.valor`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "mensalidades" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `escola_mista` · `mensalidades.vencimento`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "mensalidades" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `escola_mista` · `students.enrolled_at`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "students" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `fintech_opaca` · `apolices.dt_emissao`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "apolices" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `fintech_opaca` · `cad_cliente.dt_cad`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "cad_cliente" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `fintech_opaca` · `mov_financeira.dt_mov`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "mov_financeira" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `marketplace_en` · `payments.amount`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "payments" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)

### Pessoal nos dois lados, categoria errada

Nenhum.

## Achados estruturais

| Achado | VP | FP | FN | Precisão | Recall |
|---|---:|---:|---:|---:|---:|
| INDICIO_MENOR | 2 | 0 | 0 | 100% | 100% |
| PESSOAL_EM_LOG | 4 | 0 | 0 | 100% | 100% |
| SEM_CICLO_DE_VIDA | 3 | 2 | 0 | 60% | 100% |
| SENSIVEL_SEM_PROTECAO | 17 | 1 | 0 | 94% | 100% |
| TEXTO_LIVRE | 4 | 0 | 0 | 100% | 100% |

### Achados que faltaram

Nenhum.

### Achados a mais

- `clinica_legado` · SENSIVEL_SEM_PROTECAO · `tb_vacina.cd_vacina`
- `fintech_opaca` · SEM_CICLO_DE_VIDA · `cad_cliente`
- `fintech_opaca` · SEM_CICLO_DE_VIDA · `mov_financeira`

### Colunas com "depende" no gabarito (fora das métricas) (23)

- `clinica_legado` · `tb_consulta.vl_consulta`: gabarito **financeiro**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `clinica_legado` · `tb_convenio.ds_contato`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `clinica_legado` · `tb_convenio.nr_cnpj`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (media). o nome da coluna contém "CNPJ"
- `clinica_legado` · `tb_paciente.ds_observacao`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "tb_paciente" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `escola_mista` · `frequencia.justificativa`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `escola_mista` · `frequencia.presente`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `fintech_opaca` · `apolices.valor_cobertura`: gabarito **financeiro**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "apolices" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `fintech_opaca` · `cad_cliente.doc`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (alta). o COMMENT da coluna cita "CPF ou CNPJ"
- `fintech_opaca` · `mov_financeira.cod_barras`: gabarito **financeiro**, a Tarja disse **nao_identificado** (baixa). o nome da coluna contém "código interno"
- `fintech_opaca` · `mov_financeira.cpf_cnpj_fav`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (alta). o nome da coluna contém "CPF ou CNPJ"
- `fintech_opaca` · `mov_financeira.hist`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "mov_financeira" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
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
- `rh_misto` · `Empregado.Obs`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "Empregado" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `rh_misto` · `tb_ponto_log.batida_em`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
