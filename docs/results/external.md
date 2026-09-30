# Resultado do corpus: external

Colunas: 153 (137 avaliadas, 16 com "depende" fora das métricas).
Acerto exato de categoria: 92%.
Subtipo de dado sensível certo: 0 de 0.

| Categoria | Suporte | Precisão | Recall | F1 |
|---|---:|---:|---:|---:|
| Sensível | 0 | n/d | n/d | n/d |
| Criança/adolescente (indício) | 0 | n/d | n/d | n/d |
| Identificador direto | 21 | 90% | 86% | 88% |
| Localização | 5 | 83% | 100% | 91% |
| Financeiro | 1 | 100% | 100% | 100% |
| Outro dado pessoal | 7 | 100% | 29% | 44% |
| Não identificado | 103 | 93% | 97% | 95% |
| **Dado pessoal vs não pessoal** (binária) | 34 | 90% | 76% | 83% |

Contagens da métrica binária: VP 26, FP 3, FN 8. "depende" da Tarja conta como positivo.

## Erros, com os falsos negativos de dado pessoal primeiro

### Falsos negativos de dado pessoal (passou sem marcar) (8)

- `employees` · `employees.emp_no`: gabarito **identificador_direto**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `employees` · `employees.hire_date`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `employees` · `titles.title`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `sakila` · `staff.picture`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `wordpress` · `wp_comments.comment_author`: gabarito **identificador_direto**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `wordpress` · `wp_comments.comment_author_url`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `wordpress` · `wp_users.user_nicename`: gabarito **identificador_direto**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `wordpress` · `wp_users.user_url`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal

### Falsos positivos (marcou dado pessoal onde o gabarito diz que não é) (3)

- `employees` · `departments.dept_name`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna contém "nome"; o tipo VARCHAR(40) combina
- `sakila` · `city.city`: gabarito **nao_identificado**, a Tarja disse **localizacao** (baixa). o nome da coluna é "cidade"
- `sakila` · `language.name`: gabarito **nao_identificado**, a Tarja disse **identificador_direto** (baixa). o nome da coluna é "nome"; o tipo CHAR(20) combina

### Pessoal nos dois lados, categoria errada

Nenhum.

## Achados estruturais

| Achado | VP | FP | FN | Precisão | Recall |
|---|---:|---:|---:|---:|---:|
| SEM_CICLO_DE_VIDA | 3 | 9 | 0 | 25% | 100% |
| TEXTO_LIVRE | 1 | 1 | 0 | 50% | 100% |

### Achados que faltaram

Nenhum.

### Achados a mais

- `employees` · SEM_CICLO_DE_VIDA · `employees`
- `employees` · SEM_CICLO_DE_VIDA · `departments`
- `employees` · SEM_CICLO_DE_VIDA · `salaries`
- `sakila` · SEM_CICLO_DE_VIDA · `city`
- `sakila` · SEM_CICLO_DE_VIDA · `customer`
- `sakila` · SEM_CICLO_DE_VIDA · `language`
- `wordpress` · SEM_CICLO_DE_VIDA · `wp_users`
- `wordpress` · SEM_CICLO_DE_VIDA · `wp_comments`
- `wordpress` · TEXTO_LIVRE · `wp_comments.comment_author`
- `wordpress` · SEM_CICLO_DE_VIDA · `wp_signups`

### Colunas com "depende" no gabarito (fora das métricas) (16)

- `employees` · `dept_emp.from_date`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `employees` · `dept_emp.to_date`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `employees` · `dept_manager.from_date`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `employees` · `dept_manager.to_date`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `employees` · `salaries.from_date`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `employees` · `salaries.to_date`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `employees` · `titles.from_date`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `employees` · `titles.to_date`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `sakila` · `staff.password`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `wordpress` · `wp_comments.comment_agent`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `wordpress` · `wp_comments.comment_content`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `wordpress` · `wp_signups.activation_key`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `wordpress` · `wp_signups.meta`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `wordpress` · `wp_usermeta.meta_value`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `wordpress` · `wp_users.user_activation_key`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `wordpress` · `wp_users.user_pass`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
