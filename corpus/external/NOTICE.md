# Corpus externo v1 (terceiros)

Schemas públicos que **não fui eu que escrevi**. Baixados em 2026-09-30.

| Arquivo | Fonte | Licença | No repositório? |
|---|---|---|---|
| `sakila.sql` | https://raw.githubusercontent.com/jOOQ/sakila/main/mysql-sakila-db/mysql-sakila-schema.sql | BSD de 3 cláusulas (no cabeçalho do arquivo) | sim, sem alteração |
| `employees.sql` | https://raw.githubusercontent.com/datacharmer/test_db/master/employees.sql | Creative Commons Atribuição-CompartilhaIgual 3.0 (no cabeçalho) | sim, sem alteração, com a atribuição original |
| `wordpress` (tabelas `users`, `usermeta`, `comments`, `signups`) | `wp-admin/includes/schema.php` do WordPress, commit fixo em `scripts/fetch-external.ts` | GPL v2 ou posterior | **não**: baixado por `npm run corpus:fetch` para `.fetched/` |

Os gabaritos (`*.gold.txt`) foram escritos à mão **antes** de rodar o classificador. Eles só listam nomes de colunas e a minha classificação; a licença deles é a do projeto.

Nada aqui tem dado de pessoas reais: são só definições de tabela.
