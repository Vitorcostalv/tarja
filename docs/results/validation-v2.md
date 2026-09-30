# Resultado do corpus: validation-v2

Colunas: 257 (239 avaliadas, 18 com "depende" fora das métricas).
Acerto exato de categoria: 87%.
Subtipo de dado sensível certo: 8 de 11.

| Categoria | Suporte | Precisão | Recall | F1 |
|---|---:|---:|---:|---:|
| Sensível | 11 | 80% | 73% | 76% |
| Criança/adolescente (indício) | 4 | 67% | 100% | 80% |
| Identificador direto | 42 | 88% | 88% | 88% |
| Localização | 16 | 100% | 88% | 93% |
| Financeiro | 21 | 100% | 76% | 86% |
| Outro dado pessoal | 15 | 48% | 100% | 65% |
| Não identificado | 130 | 95% | 88% | 91% |
| **Dado pessoal vs não pessoal** (binária) | 109 | 87% | 94% | 90% |

Contagens da métrica binária: VP 103, FP 16, FN 6. "depende" da Tarja conta como positivo.

## Erros, com os falsos negativos de dado pessoal primeiro

### Falsos negativos de dado pessoal (passou sem marcar) (6)

- `banco_digital` · `contas.numero`: gabarito **financeiro**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `hospital_en` · `patients.blood_type`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `rh_saas` · `payroll_items.bruto`: gabarito **financeiro**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `rh_saas` · `payroll_items.inss`: gabarito **financeiro**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `rh_saas` · `payroll_items.irrf`: gabarito **financeiro**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `rh_saas` · `payroll_items.liquido`: gabarito **financeiro**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal

### Falsos positivos (marcou dado pessoal onde o gabarito diz que não é) (16)

- `banco_digital` · `documentos_kyc.tipo_documento`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna contém "documento"; o tipo VARCHAR(20) combina
- `hospital_en` · `lab_results.taken_at`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "lab_results" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `hospital_en` · `wards.beds`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "wards" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `hospital_en` · `wards.floor`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "wards" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `hospital_en` · `wards.name`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna é "nome"; o tipo VARCHAR(50) combina
- `petshop` · `agendamentos.tutor_id`: gabarito **nao_identificado**, a Tarja disse **crianca_adolescente** (alta). o nome da coluna contém "responsável legal"
- `petshop` · `atendimentos.diagnostico`: gabarito **nao_identificado**, a Tarja disse **sensivel** (alta). o nome da coluna é "saúde"
- `petshop` · `especies.nome`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna é "nome"; o tipo varchar(40) combina
- `petshop` · `pets.alergias`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "pets" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `petshop` · `pets.data_nascimento`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (media). o nome da coluna contém "data de nascimento"; o tipo date combina
- `petshop` · `pets.nome`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna é "nome"; o tipo varchar(60) combina
- `petshop` · `pets.peso_kg`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "pets" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `petshop` · `pets.raca`: gabarito **nao_identificado**, a Tarja disse **sensivel** (alta). o nome da coluna é "raça, cor ou etnia"
- `petshop` · `pets.tutor_id`: gabarito **nao_identificado**, a Tarja disse **crianca_adolescente** (alta). o nome da coluna contém "responsável legal"
- `rh_saas` · `audit_trail.action`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "audit_trail" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `rh_saas` · `audit_trail.target_table`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "audit_trail" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)

### Pessoal nos dois lados, categoria errada (9)

- `banco_digital` · `clientes_pf.complemento`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "clientes_pf" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `banco_digital` · `clientes_pf.numero`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "clientes_pf" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `banco_digital` · `documentos_kyc.frente_url`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "documentos_kyc" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `banco_digital` · `documentos_kyc.verso_url`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "documentos_kyc" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `hospital_en` · `lab_results.result_value`: gabarito **sensivel:saude**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "lab_results" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `hospital_en` · `lab_results.test_name`: gabarito **sensivel:saude**, a Tarja disse **identificador_direto** (baixa). o nome da coluna contém "nome"; o tipo VARCHAR(100) combina
- `hospital_en` · `patients.ssn`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patients" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `hospital_en` · `physicians.license_number`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "physicians" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `petshop` · `veterinarios.crmv`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "veterinarios" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)

## Achados estruturais

| Achado | VP | FP | FN | Precisão | Recall |
|---|---:|---:|---:|---:|---:|
| INDICIO_MENOR | 1 | 2 | 0 | 33% | 100% |
| PESSOAL_EM_LOG | 3 | 0 | 0 | 100% | 100% |
| SEM_CICLO_DE_VIDA | 1 | 1 | 0 | 50% | 100% |
| SENSIVEL_SEM_PROTECAO | 7 | 2 | 5 | 78% | 58% |
| TEXTO_LIVRE | 1 | 1 | 0 | 50% | 100% |

### Achados que faltaram

- `hospital_en` · SENSIVEL_SEM_PROTECAO · `patients.blood_type`
- `hospital_en` · SENSIVEL_SEM_PROTECAO · `patients.insurance_number`
- `hospital_en` · SENSIVEL_SEM_PROTECAO · `lab_results.test_name`
- `hospital_en` · SENSIVEL_SEM_PROTECAO · `lab_results.result_value`
- `hospital_en` · SENSIVEL_SEM_PROTECAO · `billing.insurance_claim_no`

### Achados a mais

- `hospital_en` · SEM_CICLO_DE_VIDA · `admissions`
- `petshop` · INDICIO_MENOR · `pets`
- `petshop` · SENSIVEL_SEM_PROTECAO · `pets.raca`
- `petshop` · SENSIVEL_SEM_PROTECAO · `atendimentos.diagnostico`
- `petshop` · INDICIO_MENOR · `agendamentos`
- `petshop` · TEXTO_LIVRE · `agendamentos.observacao`

### Colunas com "depende" no gabarito (fora das métricas) (18)

- `banco_digital` · `clientes_pf.pep`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `banco_digital` · `clientes_pj.cnpj`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (media). o nome da coluna é "CNPJ"
- `banco_digital` · `clientes_pj.email_financeiro`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (media). o nome da coluna contém "e-mail"; o tipo VARCHAR(150) combina
- `banco_digital` · `transacoes.descricao`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "transacoes" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `banco_digital` · `transacoes.favorecido_documento`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (media). o nome da coluna contém "titular ou favorecido"; o tipo VARCHAR(18) combina
- `ead` · `certificados.pdf_url`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `ead` · `log_visualizacao.dispositivo`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `ead` · `matriculas.nota_final`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `ead` · `matriculas.progresso`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `ead` · `tickets_suporte.assunto`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `ead` · `tickets_suporte.mensagem`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `hospital_en` · `admissions.ward`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `hospital_en` · `billing.insurance_claim_no`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `hospital_en` · `patients.insurance_number`: gabarito **sensivel:saude**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patients" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `hospital_en` · `patients.notes`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patients" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `petshop` · `agendamentos.observacao`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `petshop` · `pets.microchip`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "pets" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `rh_saas` · `companies.cnpj`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (media). o nome da coluna é "CNPJ"
