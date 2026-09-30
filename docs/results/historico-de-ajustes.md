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

---

# Rodada de ajustes 3 (depois do revisor decidir o rumo; corpora v2 já escritos e congelados antes)

Ordem do que aconteceu: (1) validação v1 e externo v1 declarados corpora de desenvolvimento (`validacao-v1-queimada.md`); (2) corpora v2 escritos, com gabarito, e congelados num commit (`9cb7767`); (3) **só então** as mudanças abaixo. Os corpora v2 não foram usados para orientar nenhuma delas.

| # | Mudança | Por quê |
|---|---|---|
| 3.1 | "nome" virou regra fraca: só vale se nenhuma regra mais específica casar. Nova regra `nid.nome_de_coisa` para "nome" + produto, empresa, categoria, marca, loja, curso, departamento, serviço, plano, arquivo, projeto, campanha, evento, sistema, estado, país. | Decisão do revisor: `nm_*` é qualificador, o substantivo específico manda (`nm_cidade` é cidade). |
| 3.2 | Chave estrangeira declarada (FOREIGN KEY, inclusive REFERENCES na coluna) vira regra `nid.fk` (pontuação 10; 12 se a tabela referenciada, no mesmo DDL, é catálogo). `codigo` deixou de ser chave forte (peso 5, regra `nid.codigo`); `id` continua forte (9). | Decisão do revisor: separar `cd_cid` de `diagnostico_id` pela estrutura. Sem FK, `cd_cid` em tabela de saúde é dado de saúde; `diagnostico_id` continua chave (tem o token `id`); `cd_paciente` continua chave (nenhuma outra regra casa). Não quebrou nenhum dos dois. |
| 3.3 | Contexto da tabela: coluna sem regra, em tabela que tem identificador direto de pessoa, vira "outro dado pessoal" com confiança BAIXA, "depende", motivo "contexto da tabela". Fora: PK, FK, booleano, colunas de sistema, credencial e estado, e tabela de catálogo. | Decisão do revisor. Base: art. 5º, I (informação relacionada a pessoa identificada), lido em `docs/research/01`. Custo declarado: sobe o recall e **cai a precisão**. |
| 3.4 | `SEM_CICLO_DE_VIDA` só para tabela com dado pessoal de confiança média ou alta; fora tabela de ligação (PK composta só de FKs) e tabela de catálogo. Vocabulário de criação ganhou `create`, `creation`, `registered`, `joined`, `added`. | Decisão do revisor (precisão de 25% no externo v1). |
| 3.5 | `INDICIO_MENOR` também quando a tabela tem data de nascimento e o nome indica escola ou responsável. | Decisão do revisor. |
| 3.6 | Notas: foto é dado pessoal comum (biometria só com indício de uso para identificar, por nome ou COMMENT); gênero é pessoal e a nota diz que orientação e vida sexual são sensíveis. | Decisão do revisor. |
| 3.7 | "Não identificado" passou a se chamar "Não identificado pelas regras" em tela e relatório; o relatório avisa quantas colunas ficaram sem regra. | Decisão do revisor. |
| 3.8 | Palavras de evento de sistema (`registered`, `activated`, `approved`...) ficam fora do contexto da tabela. | Corrige falsos positivos da 3.3 vistos no externo v1 (desenvolvimento). |

## Resultado da única execução dos corpora v2 e o que mudou depois

Execuções registradas em `docs/validation-runs-v2.md` (commit do motor da rodada 3). Resultados completos em `docs/results/validation-v2.md` e `docs/results/external-v2.md`.

| Corpus v2 | Colunas avaliadas | Precisão binária | Recall binário | FN | FP |
|---|---:|---:|---:|---:|---:|
| Validação v2 (schemas fictícios meus, gabarito antes das regras) | 239 | 87% | 94% | 6 | 16 |
| Externo v2 (Northwind, Chinook, OpenEMR; não escrevi) | 377 | 73% | 90% | 14 | 49 |

**Única mudança feita DEPOIS de ver os resultados v2:** o achado `SEM_CICLO_DE_VIDA` foi rebaixado a "informativo". A precisão dele no externo v2 foi 57%, abaixo do mínimo de 60% definido pelo revisor (na validação v2 foi 50%, com 2 ocorrências). Regra do revisor, aplicada como combinado; nenhuma regra de classificação foi tocada.

**O que NÃO foi corrigido, de propósito** (corrigir olhando para os v2 queimaria os dois, e o revisor decide):

- `suppliers` (Northwind) e qualquer tabela de fornecedor/empresa: a tabela cai em "coisa", e `first_name`, `last_name`, e-mail e telefone da pessoa de contato passam sem marcar (6 dos 14 falsos negativos do externo v2).
- Nome genérico (`Name`, `status_name`, `privilege_name`) em tabela sem contexto de pessoa vira "identificador direto, confiança baixa" (9 dos 49 falsos positivos do externo v2).
- Nomes grudados ou abreviados fora do dicionário (`fname`, `lname`, `guardiansname`, `ethnoracial`, `drivers_license`, `DOB`): o tokenizador não separa palavras minúsculas coladas.
- Saúde e raça de **animal** (`pets.raca`, `atendimentos.diagnostico`) e "tutor" como dono do pet: armadilhas de propósito do v2, todas erradas. A Tarja não distingue humano de animal.
- Coluna de dado de saúde sem a palavra de saúde (`prescriptions.drug`, `dosage`, `payroll_items.bruto/inss/irrf/liquido`, `contas.numero`): o contexto da tabela de saúde só cobre algumas palavras.

## Depois das execuções v2: só texto e interface (nenhuma pontuação mudou)

- O **motivo** passou a nomear a palavra que casou: `o nome da coluna contém "sanguineo" (saúde)` em vez de só `"saúde"`. Não mexe em pontuação nem em classificação; os números v2 continuam valendo.
- A revisão "sem pista" ignora chave, data de sistema, credencial, estado e booleano (`colunaDeSistema`). Só muda a lista mostrada, não a classificação.
- Interface, CSP, worker, 404 e OG estática.
