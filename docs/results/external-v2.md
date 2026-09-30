# Resultado do corpus: external-v2

Colunas: 569 (377 avaliadas, 192 com "depende" fora das métricas).
Acerto exato de categoria: 71%.
Subtipo de dado sensível certo: 5 de 11.

| Categoria | Suporte | Precisão | Recall | F1 |
|---|---:|---:|---:|---:|
| Sensível | 11 | 83% | 45% | 59% |
| Criança/adolescente (indício) | 11 | n/d | 0% | n/d |
| Identificador direto | 68 | 81% | 56% | 66% |
| Localização | 33 | 95% | 61% | 74% |
| Financeiro | 1 | 100% | 100% | 100% |
| Outro dado pessoal | 23 | 20% | 91% | 32% |
| Não identificado | 230 | 93% | 79% | 85% |
| **Dado pessoal vs não pessoal** (binária) | 147 | 73% | 90% | 81% |

Contagens da métrica binária: VP 133, FP 49, FN 14. "depende" da Tarja conta como positivo.

## Erros, com os falsos negativos de dado pessoal primeiro

### Falsos negativos de dado pessoal (passou sem marcar) (14)

- `chinook` · `Invoice.BillingCountry`: gabarito **localizacao**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `chinook` · `Invoice.BillingState`: gabarito **localizacao**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.email_address`: gabarito **identificador_direto**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.first_name`: gabarito **identificador_direto**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.home_phone`: gabarito **identificador_direto**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.job_title`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.last_name`: gabarito **identificador_direto**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.mobile_phone`: gabarito **identificador_direto**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `employer_data.occupation`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (alta). o COMMENT da coluna cita "chave interna"
- `openemr` · `immunizations.administered_date`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.dosage`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.drug`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.drug_dosage_instructions`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.indication`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal

### Falsos positivos (marcou dado pessoal onde o gabarito diz que não é) (49)

- `chinook` · `Artist.Name`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna é "nome"; o tipo NVARCHAR(120) combina
- `chinook` · `Employee.ReportsTo`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "Employee" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `chinook` · `MediaType.Name`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna é "nome"; o tipo NVARCHAR(120) combina
- `chinook` · `Playlist.Name`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna é "nome"; o tipo NVARCHAR(120) combina
- `chinook` · `Track.Bytes`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "Track" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `chinook` · `Track.Milliseconds`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "Track" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `chinook` · `Track.Name`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna é "nome"; o tipo NVARCHAR(200) combina
- `chinook` · `Track.UnitPrice`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "Track" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `employees.attachments`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "employees" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `employees.company`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "employees" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `employees.web_page`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "employees" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `inventory_transaction_types.type_name`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna contém "nome"; o tipo VARCHAR(50) combina
- `northwind` · `order_details_status.status_name`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna contém "nome"; o tipo VARCHAR(50) combina
- `northwind` · `orders_status.status_name`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna contém "nome"; o tipo VARCHAR(50) combina
- `northwind` · `orders_tax_status.tax_status_name`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna contém "nome"; o tipo VARCHAR(50) combina
- `northwind` · `orders.paid_date`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "orders" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `orders.shipped_date`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "orders" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `orders.shipping_fee`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "orders" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `orders.tax_rate`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "orders" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `orders.taxes`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "orders" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `privileges.privilege_name`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna contém "nome"; o tipo VARCHAR(50) combina
- `openemr` · `employer_data.date`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "employer_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `employer_data.pid`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "employer_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `insurance_data.accept_assignment`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "insurance_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `insurance_data.date`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "insurance_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `insurance_data.date_end`: gabarito **nao_identificado**, a Tarja disse **localizacao** (media). o nome da coluna contém "endereço"
- `openemr` · `insurance_data.pid`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "insurance_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `insurance_data.provider`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "insurance_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.care_team_facility`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.date`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.dupscore`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.pid`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.pricelevel`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.regdate`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.soap_import_status`: gabarito **nao_identificado**, a Tarja disse **sensivel** (alta). o COMMENT da coluna cita "saúde"
- `openemr` · `patient_data.squad`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.authorized`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.billing_facility`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.cal_ui`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.default_warehouse`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.facility`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.irnpool`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.main_menu_role`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.newcrop_user_role`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.organization`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.patient_menu_role`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.see_auth`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.source`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.taxonomy`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)

### Pessoal nos dois lados, categoria errada (48)

- `chinook` · `Customer.Country`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "Customer" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `chinook` · `Customer.Fax`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "Customer" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `chinook` · `Customer.State`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "Customer" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `chinook` · `Employee.Country`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "Employee" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `chinook` · `Employee.Fax`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "Employee" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `chinook` · `Employee.State`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "Employee" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `employees.country_region`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "employees" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `employees.state_province`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "employees" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `insurance_data.subscriber_country`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "insurance_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `insurance_data.subscriber_fname`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "insurance_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `insurance_data.subscriber_lname`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "insurance_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `insurance_data.subscriber_mname`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "insurance_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `insurance_data.subscriber_ss`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "insurance_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `insurance_data.subscriber_state`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "insurance_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.birth_fname`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (media). o nome da coluna contém "data de nascimento"; o tipo TEXT combina
- `openemr` · `patient_data.birth_lname`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (media). o nome da coluna contém "data de nascimento"; o tipo TEXT combina
- `openemr` · `patient_data.birth_mname`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (media). o nome da coluna contém "data de nascimento"; o tipo TEXT combina
- `openemr` · `patient_data.country_code`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.county`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.drivers_license`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.ethnoracial`: gabarito **sensivel:racial**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.fname`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.guardianaddress`: gabarito **crianca_adolescente**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.guardiancity`: gabarito **crianca_adolescente**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.guardiancountry`: gabarito **crianca_adolescente**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.guardianemail`: gabarito **crianca_adolescente**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.guardianphone`: gabarito **crianca_adolescente**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.guardianpostalcode`: gabarito **crianca_adolescente**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.guardianrelationship`: gabarito **crianca_adolescente**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.guardiansex`: gabarito **crianca_adolescente**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.guardiansname`: gabarito **crianca_adolescente**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.guardianstate`: gabarito **crianca_adolescente**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.guardianworkphone`: gabarito **crianca_adolescente**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.lname`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.mname`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.mothersname`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.pubpid`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.ss`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.state`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.federaldrugid`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.federaltaxid`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.fname`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.lname`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.mname`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.npi`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.phonecell`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.state_license_number`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.upin`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)

## Achados estruturais

| Achado | VP | FP | FN | Precisão | Recall |
|---|---:|---:|---:|---:|---:|
| INDICIO_MENOR | 0 | 0 | 1 | n/d | 0% |
| SEM_CICLO_DE_VIDA | 4 | 3 | 1 | 57% | 80% |
| SENSIVEL_SEM_PROTECAO | 5 | 2 | 31 | 71% | 14% |
| TEXTO_LIVRE | 6 | 1 | 2 | 86% | 75% |

### Achados que faltaram

- `northwind` · SEM_CICLO_DE_VIDA · `suppliers`
- `northwind` · TEXTO_LIVRE · `suppliers.notes`
- `openemr` · SENSIVEL_SEM_PROTECAO · `patient_data.ethnoracial`
- `openemr` · SENSIVEL_SEM_PROTECAO · `patient_data.tribal_affiliations`
- `openemr` · SENSIVEL_SEM_PROTECAO · `patient_data.completed_ad`
- `openemr` · SENSIVEL_SEM_PROTECAO · `patient_data.ad_reviewed`
- `openemr` · SENSIVEL_SEM_PROTECAO · `patient_data.deceased_reason`
- `openemr` · SENSIVEL_SEM_PROTECAO · `patient_data.imm_reg_status`
- `openemr` · SENSIVEL_SEM_PROTECAO · `patient_data.imm_reg_stat_effdate`
- `openemr` · SENSIVEL_SEM_PROTECAO · `insurance_data.plan_name`
- `openemr` · SENSIVEL_SEM_PROTECAO · `insurance_data.policy_number`
- `openemr` · SENSIVEL_SEM_PROTECAO · `insurance_data.group_number`
- `openemr` · SENSIVEL_SEM_PROTECAO · `prescriptions.drug`
- `openemr` · SENSIVEL_SEM_PROTECAO · `prescriptions.dosage`
- `openemr` · SENSIVEL_SEM_PROTECAO · `prescriptions.indication`
- `openemr` · SENSIVEL_SEM_PROTECAO · `prescriptions.drug_dosage_instructions`
- `openemr` · SENSIVEL_SEM_PROTECAO · `prescriptions.start_date`
- `openemr` · SENSIVEL_SEM_PROTECAO · `prescriptions.rxnorm_drugcode`
- `openemr` · SENSIVEL_SEM_PROTECAO · `prescriptions.form`
- `openemr` · SENSIVEL_SEM_PROTECAO · `prescriptions.quantity`
- `openemr` · SENSIVEL_SEM_PROTECAO · `prescriptions.route`
- `openemr` · SENSIVEL_SEM_PROTECAO · `prescriptions.interval`
- `openemr` · SENSIVEL_SEM_PROTECAO · `prescriptions.medication`
- `openemr` · SENSIVEL_SEM_PROTECAO · `prescriptions.note`
- `openemr` · SENSIVEL_SEM_PROTECAO · `prescriptions.drug_info_erx`
- `openemr` · SENSIVEL_SEM_PROTECAO · `prescriptions.prn`
- `openemr` · SENSIVEL_SEM_PROTECAO · `immunizations.administered_date`
- `openemr` · SENSIVEL_SEM_PROTECAO · `immunizations.cvx_code`
- `openemr` · SENSIVEL_SEM_PROTECAO · `immunizations.note`
- `openemr` · SENSIVEL_SEM_PROTECAO · `immunizations.completion_status`
- `openemr` · SENSIVEL_SEM_PROTECAO · `immunizations.refusal_reason`
- `openemr` · SENSIVEL_SEM_PROTECAO · `immunizations.reason_code`
- `openemr` · SENSIVEL_SEM_PROTECAO · `immunizations.reason_description`
- `openemr` · TEXTO_LIVRE · `immunizations.note`
- `openemr` · INDICIO_MENOR · `patient_data`

### Achados a mais

- `chinook` · SEM_CICLO_DE_VIDA · `Employee`
- `chinook` · SEM_CICLO_DE_VIDA · `Invoice`
- `northwind` · TEXTO_LIVRE · `orders.notes`
- `openemr` · SENSIVEL_SEM_PROTECAO · `patient_data.allow_health_info_ex`
- `openemr` · SENSIVEL_SEM_PROTECAO · `patient_data.soap_import_status`
- `openemr` · SEM_CICLO_DE_VIDA · `insurance_data`

### Colunas com "depende" no gabarito (fora das métricas) (192)

- `chinook` · `Customer.Company`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "Customer" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `chinook` · `Track.Composer`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "Track" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `customers.address`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna é "endereço"
- `northwind` · `customers.attachments`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "customers" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `customers.business_phone`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (media). o nome da coluna contém "telefone"; o tipo VARCHAR(25) combina
- `northwind` · `customers.city`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna é "cidade"; o nome da tabela "customers" indica pessoas
- `northwind` · `customers.company`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "customers" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `customers.country_region`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "customers" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `customers.fax_number`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "customers" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `customers.notes`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "customers" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `customers.state_province`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "customers" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `customers.web_page`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "customers" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `customers.zip_postal_code`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna contém "CEP"
- `northwind` · `employees.fax_number`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "employees" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `employees.notes`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "employees" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `inventory_transactions.comments`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `orders.notes`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "orders" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `orders.ship_address`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna contém "endereço"
- `northwind` · `orders.ship_city`: gabarito **localizacao**, a Tarja disse **localizacao** (baixa). o nome da coluna contém "cidade"
- `northwind` · `orders.ship_country_region`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "orders" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `orders.ship_name`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (baixa). o nome da coluna contém "nome"; o tipo VARCHAR(50) combina
- `northwind` · `orders.ship_state_province`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "orders" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `orders.ship_zip_postal_code`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna contém "CEP"
- `northwind` · `purchase_orders.notes`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `shippers.address`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna é "endereço"
- `northwind` · `shippers.attachments`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "shippers" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `shippers.business_phone`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (media). o nome da coluna contém "telefone"; o tipo VARCHAR(25) combina
- `northwind` · `shippers.city`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna é "cidade"; a tabela "shippers" tem 4 colunas que só fazem sentido para pessoas (CPF, e-mail, telefone...)
- `northwind` · `shippers.company`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "shippers" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `shippers.country_region`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "shippers" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `shippers.fax_number`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "shippers" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `shippers.notes`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "shippers" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `shippers.state_province`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "shippers" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `shippers.web_page`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "shippers" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `northwind` · `shippers.zip_postal_code`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna contém "CEP"
- `northwind` · `suppliers.address`: gabarito **localizacao**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.attachments`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.business_phone`: gabarito **identificador_direto**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.city`: gabarito **localizacao**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.company`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.country_region`: gabarito **localizacao**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.fax_number`: gabarito **identificador_direto**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.notes`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.state_province`: gabarito **localizacao**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.web_page`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `northwind` · `suppliers.zip_postal_code`: gabarito **localizacao**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `employer_data.city`: gabarito **localizacao**, a Tarja disse **localizacao** (baixa). o nome da coluna é "cidade"
- `openemr` · `employer_data.country`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "employer_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `employer_data.end_date`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "employer_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `employer_data.industry`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (alta). o COMMENT da coluna cita "chave interna"
- `openemr` · `employer_data.name`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna é "nome"; o tipo varchar(255) combina
- `openemr` · `employer_data.postal_code`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna contém "CEP"
- `openemr` · `employer_data.start_date`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "employer_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `employer_data.state`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "employer_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `employer_data.street`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna é "endereço"
- `openemr` · `employer_data.street_line_2`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna contém "endereço"
- `openemr` · `immunizations.administered_by`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (alta). o COMMENT da coluna cita "chave interna"
- `openemr` · `immunizations.administration_site`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `immunizations.amount_administered`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `immunizations.amount_administered_unit`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `immunizations.completion_status`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `immunizations.cvx_code`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `immunizations.education_date`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `immunizations.information_source`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `immunizations.note`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `immunizations.ordering_provider`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `immunizations.reason_code`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `immunizations.reason_description`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `immunizations.refusal_reason`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `immunizations.route`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `immunizations.vis_date`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `insurance_data.copay`: gabarito **financeiro**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "insurance_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `insurance_data.group_number`: gabarito **sensivel:saude**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "insurance_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `insurance_data.plan_name`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (alta). o nome da coluna é "nome de coisa (produto, empresa, categoria...)"
- `openemr` · `insurance_data.policy_number`: gabarito **sensivel:saude**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "insurance_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `insurance_data.subscriber_employer_city`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna contém "cidade"; a tabela "insurance_data" tem 2 colunas que só fazem sentido para pessoas (CPF, e-mail, telefone...)
- `openemr` · `insurance_data.subscriber_employer_country`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "insurance_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `insurance_data.subscriber_employer_postal_code`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna contém "CEP"
- `openemr` · `insurance_data.subscriber_employer_state`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "insurance_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `insurance_data.subscriber_employer_street`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna contém "endereço"
- `openemr` · `insurance_data.subscriber_employer_street_line_2`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna contém "endereço"
- `openemr` · `patient_data.ad_reviewed`: gabarito **sensivel:saude**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.advance_directive_user_authenticator`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (alta). o COMMENT da coluna cita "chave interna"
- `openemr` · `patient_data.allow_health_info_ex`: gabarito **outro_dado_pessoal**, a Tarja disse **sensivel** (media). o nome da coluna contém "saúde"
- `openemr` · `patient_data.allow_imm_info_share`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.allow_imm_reg_use`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.allow_patient_portal`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.billing_note`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.care_team_provider`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.care_team_status`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `patient_data.completed_ad`: gabarito **sensivel:saude**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.contrastart`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.deceased_date`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.deceased_reason`: gabarito **sensivel:saude**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.financial`: gabarito **financeiro**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.financial_review`: gabarito **financeiro**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.fitness`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.gender_identity`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (media). o nome da coluna contém "sexo ou gênero"; o tipo TEXT combina
- `openemr` · `patient_data.genericname1`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.genericname2`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.genericval1`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.genericval2`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.hipaa_allowemail`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.hipaa_allowsms`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.hipaa_mail`: gabarito **outro_dado_pessoal**, a Tarja disse **identificador_direto** (media). o nome da coluna contém "e-mail"; o tipo varchar(3) combina
- `openemr` · `patient_data.hipaa_message`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.hipaa_notice`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.hipaa_voice`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.homeless`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.imm_reg_stat_effdate`: gabarito **sensivel:saude**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.imm_reg_status`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `patient_data.interpreter`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.interpreter_needed`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (alta). o COMMENT da coluna cita "chave interna"
- `openemr` · `patient_data.migrantseasonal`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.patient_groups`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.prevent_portal_apps`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.pronoun`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.prot_indi_effdate`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.protect_indicator`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.provider_since_date`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.publ_code_eff_date`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.publicity_code`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.referral_source`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.referrer`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.sex_identified`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.status`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `patient_data.suffix`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.tribal_affiliations`: gabarito **sensivel:racial**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.userlist1`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.userlist2`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.userlist3`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.userlist4`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.userlist5`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.userlist6`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.userlist7`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.usertext1`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.usertext2`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.usertext3`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.usertext4`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.usertext5`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.usertext6`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.usertext7`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.usertext8`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `patient_data.vfc`: gabarito **crianca_adolescente**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "patient_data" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `prescriptions.drug_info_erx`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.end_date`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.filled_date`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.form`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.interval`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.medication`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.note`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.ntx`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.prn`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.quantity`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.refills`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.request_intent`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (alta). o COMMENT da coluna cita "chave interna"
- `openemr` · `prescriptions.request_intent_title`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (alta). o COMMENT da coluna cita "chave interna"
- `openemr` · `prescriptions.route`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.rtx`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.rxnorm_drugcode`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.size`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.start_date`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.txDate`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.unit`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `prescriptions.usage_category`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (alta). o COMMENT da coluna cita "chave interna"
- `openemr` · `prescriptions.usage_category_title`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (alta). o COMMENT da coluna cita "chave interna"
- `openemr` · `users.assistant`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.billname`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.city`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna é "cidade"; o nome da tabela "users" indica pessoas
- `openemr` · `users.city2`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna contém "cidade"; o nome da tabela "users" indica pessoas
- `openemr` · `users.country_code`: gabarito **localizacao**, a Tarja disse **nao_identificado** (alta). o COMMENT da coluna cita "nome de coisa (produto, empresa, categoria...)"
- `openemr` · `users.country_code2`: gabarito **localizacao**, a Tarja disse **nao_identificado** (alta). o COMMENT da coluna cita "nome de coisa (produto, empresa, categoria...)"
- `openemr` · `users.fax`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.info`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.notes`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.password`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `users.phone`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (alta). o nome da coluna é "telefone"; o tipo varchar(30) combina
- `openemr` · `users.phonew1`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.phonew2`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.physician_type`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `openemr` · `users.state`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.state2`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.street`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna é "endereço"
- `openemr` · `users.street2`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna contém "endereço"
- `openemr` · `users.streetb`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.streetb2`: gabarito **localizacao**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.suffix`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.url`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.valedictory`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "users" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `openemr` · `users.weno_prov_id`: gabarito **identificador_direto**, a Tarja disse **nao_identificado** (alta). o nome da coluna contém "chave interna"
- `openemr` · `users.zip`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna é "CEP"
- `openemr` · `users.zip2`: gabarito **localizacao**, a Tarja disse **localizacao** (media). o nome da coluna contém "CEP"
