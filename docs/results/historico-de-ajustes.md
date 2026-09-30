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

## Ajuste 2 (bug achado por teste unitário, sem relação com corpus)

`tinyint` não estava na lista de tipos numéricos, então `tinyint(4)` era lido como texto e a checagem de tipo errava. Corrigido em `lib/lgpd/text.ts`. Não mudou nenhuma métrica dos corpora.

## Erros vistos na validação (execução 1) e NÃO corrigidos

O corpus de validação é congelado, então estes dois erros ficaram como estão, para decisão do dono do projeto:

| Coluna | O que a Tarja fez | Causa | Correção possível |
|---|---|---|---|
| `tb_consulta.cd_cid` | não identificado (alta) | `cd_` vira "código", e a regra de chave interna pesa mais que a de CID | Regra de chave perder para termo sensível inequívoco. Custo: `diagnostico_id` (FK) passaria a ser sensível. |
| `tb_paciente.nm_cidade` | identificador direto (alta) | `nm_` vira "nome", e "nome" em tabela de pessoas ganha o bônus de contexto mesmo quando há um substantivo mais específico (cidade) | Tornar a regra genérica "nome" um último recurso: só vale se nenhuma outra regra casar. |

Além disso, a primeira rodada do corpus externo mostrou que o achado `SEM_CICLO_DE_VIDA` dispara demais fora dos meus schemas (precisão 25%): o vocabulário de "data de criação" é pequeno e só em português/inglês básico (`create_date`, `last_update`, `from_date` não contam).
