# Resultado do corpus: external

Colunas: 153 (137 avaliadas, 16 com "depende" fora das métricas).
Acerto exato de categoria: 96%.
Subtipo de dado sensível certo: 0 de 0.

| Categoria | Suporte | Precisão | Recall | F1 |
|---|---:|---:|---:|---:|
| Sensível | 0 | n/d | n/d | n/d |
| Criança/adolescente (indício) | 0 | n/d | n/d | n/d |
| Identificador direto | 21 | 95% | 90% | 93% |
| Localização | 5 | 100% | 100% | 100% |
| Financeiro | 1 | 100% | 100% | 100% |
| Outro dado pessoal | 7 | 100% | 57% | 73% |
| Não identificado | 103 | 96% | 100% | 98% |
| **Dado pessoal vs não pessoal** (binária) | 34 | 100% | 88% | 94% |

Contagens da métrica binária: VP 30, FP 0, FN 4. "depende" da Tarja conta como positivo.

## Erros, com os falsos negativos de dado pessoal primeiro

### Falsos negativos de dado pessoal (passou sem marcar) (4)

- `employees` · `employees.emp_no`: gabarito **identificador_direto**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `employees` · `titles.title`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `wordpress` · `wp_users.user_nicename`: gabarito **identificador_direto**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `wordpress` · `wp_users.user_url`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal

### Falsos positivos (marcou dado pessoal onde o gabarito diz que não é)

Nenhum.

### Pessoal nos dois lados, categoria errada (1)

- `wordpress` · `wp_comments.comment_author_url`: gabarito **outro_dado_pessoal**, a Tarja disse **identificador_direto** (media). o nome da coluna contém "titular ou favorecido"; o tipo varchar(200) combina

## Achados estruturais

| Achado | VP | FP | FN | Precisão | Recall |
|---|---:|---:|---:|---:|---:|
| SEM_CICLO_DE_VIDA | 3 | 6 | 0 | 33% | 100% |
| TEXTO_LIVRE | 1 | 1 | 0 | 50% | 100% |

### Achados que faltaram

Nenhum.

### Achados a mais

- `employees` · SEM_CICLO_DE_VIDA · `employees`
- `employees` · SEM_CICLO_DE_VIDA · `salaries`
- `sakila` · SEM_CICLO_DE_VIDA · `customer`
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
