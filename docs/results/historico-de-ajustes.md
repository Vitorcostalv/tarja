# Histórico de ajustes nas regras

Toda mudança em `lib/lgpd/rules/pt-br.ts` depois da primeira rodada de um corpus entra aqui, com o motivo.
Regra do jogo: o corpus de **validação** (`corpus/validation/`) nunca é usado para ajustar regra.

## Ajuste 1 (depois da primeira rodada do corpus externo)

Erros que motivaram (ver `external-primeira-rodada.md`): `city.city`, `language.name` e `departments.dept_name` marcados como dado pessoal; `staff.picture`, `wp_comments.comment_author` e `employees.hire_date` sem marcar.

O que mudou, só lacunas sistemáticas de vocabulário (equivalente em inglês de uma palavra que já existia em português):

| Mudança | Por quê |
|---|---|
| Tabela "de coisas": `city`, `language`, `department`, `dept`, `film`, `genre` | Gêmeos de `cidade`, `idioma`, `departamento` que só existiam em português. |
| `picture` junto de `foto`/`photo` | Sinônimo de foto. |
| `author`/`autor` como nome | Quem escreveu um comentário é identificado por nome. |
| `hire` junto de `hired`/`admissao` | `hire_date` é a data de admissão. |

**Não** foram adicionados (seriam ajuste sob medida para o externo): `emp_no`, `nicename`, `title` (cargo; ambíguo com título de filme), `user_url`, `comment_author_url`.
Depois deste ajuste, o corpus externo **deixa de ser uma medida fora da amostra**: ele passou a ser mais um corpus de desenvolvimento. O número de generalização publicado é o da primeira rodada.
