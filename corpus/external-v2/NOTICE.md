# Corpus externo v2 (terceiros)

Schemas públicos **diferentes** dos do externo v1, escolhidos para cobrir nomes em inglês (Chinook, Northwind) e dado de saúde e de criança (OpenEMR). Gabaritos escritos à mão **antes** de rodar o classificador e congelados num commit.

| Arquivo | Fonte | Licença | No repositório? |
|---|---|---|---|
| `chinook.sql` (só `CREATE TABLE`) | https://github.com/lerocha/chinook-database, commit 7f67772503d71ba90f19283c38e93923addb43fa | MIT (copiada no cabeçalho) | sim |
| `northwind.sql` | https://github.com/dalers/mywind, commit 0036c3ca2f2a010b77c7880a3b4badf85dbcfc7a | BSD de 3 cláusulas (no cabeçalho) | sim, sem alteração |
| `openemr` (tabelas `patient_data`, `insurance_data`, `users`, `employer_data`, `prescriptions`, `immunizations`) | https://github.com/openemr/openemr, `sql/database.sql`, commit 08b1f2a247d346cc5772f368fd87164b80dfaaf5 | GPL v3 | **não**: baixado por `npm run corpus:fetch` para `.fetched/`, com hash conferido em `corpus/fetch-lock.json` |

Nada aqui tem dado de pessoas reais: são só definições de tabela.
