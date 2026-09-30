# Política de gabarito do corpus

Escrita **antes** de qualquer regra do classificador. Os gabaritos dos dois corpora (desenvolvimento e validação) foram escritos à mão, lendo só o DDL, sem rodar nem olhar o classificador.

Os schemas são **fictícios**. Nomes de empresas, pessoas e comentários foram inventados e não têm relação com organizações reais.

## Dois corpora

| Corpus | Pasta | Uso |
|---|---|---|
| Desenvolvimento | `corpus/dev/` | Posso olhar os erros e ajustar regras. |
| Validação | `corpus/validation/` | **Congelado** num commit. Rodo só em checkpoints e registro cada execução em `docs/validation-runs.md`. Não ajusto regra olhando para ele. |

Limite honesto: eu escrevi os dois. O gabarito reflete o meu entendimento da lei e do domínio. Isso torna os números **otimistas em relação a schemas de terceiros**. A validação tem nomes opacos, abreviações e armadilhas de propósito.

## Formato (`*.gold.txt`)

Uma coluna por linha: `tabela.coluna  categoria  [?]`

| Código | Categoria |
|---|---|
| `idd` | identificador direto (nome, CPF, RG, CNH, e-mail, telefone, login) |
| `loc` | localização (endereço, CEP, cidade, lat/long, IP) |
| `fin` | dado financeiro |
| `cri` | indício de dado de criança/adolescente |
| `sen:<subtipo>` | dado sensível. Subtipos: `racial`, `religiao`, `politica`, `sindical`, `saude`, `vida_sexual`, `genetico`, `biometrico` |
| `out` | outro dado pessoal (nascimento, gênero, estado civil, profissão, foto, vida funcional) |
| `nid` | não identificado |

Sufixo `?` = pessoal **depende** (exemplo: CNPJ de empresário individual, comentário livre). Linhas com `?` ficam **fora** da métrica binária (pessoal vs não pessoal) e são listadas à parte.

Achados estruturais esperados: `@achado ID tabela` (ou `tabela.coluna` quando o achado é por coluna).

Linhas começando com `#` são comentários.

## Critério para "pessoal"

Uma coluna é pessoal quando, **no contexto da tabela**, um encarregado montando o inventário a listaria como informação sobre uma pessoa natural (Lei 13.709/2018, art. 5º, I). Por isso:

- `clientes.nome` é pessoal; `produtos.nome`, `categorias.nome` e `empresas.razao_social` não são.
- Endereço de loja, CEP de filial, e-mail corporativo genérico (`contato@`) não são pessoais. O endereço de entrega do cliente é.
- Chaves substitutas e chaves estrangeiras (`id`, `cliente_id`), datas de sistema (`criado_em`), status, contadores e valores comerciais (`preco`, `valor_total`) **não** são pessoais, mesmo em tabela de pessoa.
- Atributo da própria pessoa (cargo, data de admissão, salário) **é** pessoal.
- Credenciais (`senha_hash`, `token`) ficam `nid?`: não identificam ninguém sozinhas, mas protegem acesso a dado pessoal.

## Precedência (uma classificação por coluna)

`sen` > `cri` > `idd` > `loc` > `fin` > `out` > `nid`.

- `cri` vale só para a coluna que existe *por causa* de ser criança/adolescente: responsável legal, flag de menor, série/turma escolar. O nome de um aluno continua `idd`; o fato de a tabela ser de alunos vira achado `INDICIO_MENOR`.
- CPF, RG e CNH são `idd` e **não** sensíveis. Dado financeiro é `fin`, **não** sensível (alto risco, mas fora do art. 5º, II).
- Gênero/sexo **não** é vida sexual (`out`). Orientação sexual é `sen:vida_sexual`. Cor/raça é `sen:racial`. Deficiência é `sen:saude`.
- Foto é `out`. Só seria biométrico se for um template/vetor facial (`sen:biometrico`).

## Achados estruturais (critérios definidos antes das regras)

| ID | Nível | Critério |
|---|---|---|
| `SEM_CICLO_DE_VIDA` | tabela | Tem coluna pessoal e **não** tem nenhuma coluna que registre quando a linha passou a existir ou quando o evento registrado ocorreu (criado_em, cadastro, abertura, emissão, registro, ocorrência...), **nem** coluna de exclusão lógica. Data de nascimento e data de fim de vigência não contam. |
| `TEXTO_LIVRE` | coluna | Coluna TEXT/MEDIUMTEXT/LONGTEXT (ou VARCHAR grande) de nome típico de texto livre (observação, descrição, comentário, notas, mensagem), **numa tabela que tem outra coluna pessoal**. |
| `SENSIVEL_SEM_PROTECAO` | coluna | Coluna `sen` sem indício de proteção no nome ou no tipo (hash, cript, enc, cifrado, token, tipo binário). |
| `PESSOAL_EM_LOG` | tabela | Tabela de log/auditoria/histórico de acesso com coluna pessoal. |
| `INDICIO_MENOR` | tabela | Tabela tem coluna `cri`, ou nome de tabela indicando criança/adolescente/aluno. |

## Mudança em relação ao pedido original

A lista inicial de categorias não tinha onde colocar data de nascimento, gênero, estado civil, profissão etc. Sem isso, essas colunas cairiam em "não identificado", o que seria um falso negativo de dado pessoal por construção. Acrescentei a categoria **`out` (outro dado pessoal)**. É uma decisão que precisa da sua aprovação.
