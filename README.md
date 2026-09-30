# Tarja

**Raio-X de LGPD para schemas SQL.** Você cola o `CREATE TABLE` do MySQL, a Tarja diz quais colunas guardam dado pessoal ou sensível, sugere como proteger e monta um rascunho do inventário de dados.

> **Status: em construção.** O motor (parser, classificador, achados, relatório, testes e corpus) está pronto. A interface, o deploy e o link público vêm na próxima etapa.
>
> Link do deploy: _em breve_ · Print: _em breve_

## O aviso que importa

- **Isto é apoio, não parecer jurídico.** Não substitui advogado nem DPO.
- **O motor não é IA.** São regras determinísticas e testáveis: dá para auditar cada decisão. Toda classificação vem com o motivo e a fonte.
- **Base legal, finalidade e prazo de retenção dependem do negócio.** A Tarja só sugere *hipóteses* de base legal, marcadas como hipótese. Finalidade fica em branco para você preencher. Retenção fica "a definir pelo controlador": a ferramenta nunca inventa prazo.

## O problema

Times pequenos guardam CPF, e-mail, endereço e até dado de saúde em tabelas sem saber o que têm. O inventário de dados que a LGPD pede (art. 37) nunca é feito porque começar dá preguiça. A Tarja lê o schema e entrega um primeiro rascunho em segundos.

## Como as regras funcionam

Cada coluna recebe **exatamente uma** classificação, com **nível de confiança** (alta, média, baixa) e o **motivo**, por exemplo: `o nome da coluna é "CPF"; o tipo VARCHAR(14) combina; o nome da tabela "clientes" indica pessoas`.

Categorias: identificador direto · localização · financeiro · criança/adolescente (indício) · sensível (com subtipo) · **outro dado pessoal** · não identificado.

> A categoria "outro dado pessoal" (data de nascimento, gênero, profissão, foto...) não estava na lista original. Sem ela, essas colunas cairiam em "não identificado", um falso negativo de dado pessoal por construção.

A decisão usa o nome da coluna (com abreviações e inglês/português: `dt_nasc`, `birth_date`, `tel`, `phone`), o tipo SQL, o `COMMENT` e o **nome da tabela**: `produtos.nome` não é dado pessoal, `clientes.nome` é. As regras são **dados** em [`lib/lgpd/rules/pt-br.ts`](lib/lgpd/rules/pt-br.ts), não lógica espalhada. A pontuação está descrita no topo desse arquivo.

Nuances que a ferramenta respeita (e que têm teste):

- **CPF, RG e CNH são dado pessoal, mas NÃO são sensíveis.** A lista do art. 5º, II é fechada.
- **Dado financeiro não é sensível pela lei, mas é de alto risco.** O relatório marca os dois campos separados.
- **CNPJ é "depende":** pessoa jurídica não é dado pessoal, mas pode ser de empresário individual ou sócio.
- **Sexo/gênero não é vida sexual.** Orientação sexual é.
- Um booleano `ativo` **não** conta como exclusão lógica.

### Fontes

Cada regra aponta para a fonte que a sustenta. Tudo foi lido no texto oficial, com URL, artigo e data de acesso em [`docs/research/`](docs/research/):

- Lei 13.709/2018 (Planalto): arts. 5º, 6º, 7º, 11, 12, 13 § 4º, 14, 15, 16, 37, 38 e 46.
- ANPD: guia de segurança para agentes de pequeno porte (itens 45 e 46) e perguntas e respostas sobre o RIPD.
- **Não confirmado:** o modelo simplificado de registro de operações da ANPD (a página devolveu HTTP 401) e o guia de inventário do Governo Digital (HTTP 404). Por isso o relatório **não segue um modelo oficial específico**; as colunas vêm do art. 37 e do conteúdo mínimo do RIPD (art. 38). Detalhes em [`docs/research/04-inventario-e-registro-de-operacoes.md`](docs/research/04-inventario-e-registro-de-operacoes.md).

### Achados do schema

Cada achado tem critério explícito, gravidade, explicação e fonte:

| Achado | Quando aparece |
|---|---|
| `SEM_CICLO_DE_VIDA` | Tabela com dado pessoal sem coluna de data de criação nem de exclusão lógica (dificulta retenção e eliminação). |
| `TEXTO_LIVRE` | Campo `TEXT` de nome típico (observação, descrição, comentário) numa tabela que já tem dado pessoal. |
| `SENSIVEL_SEM_PROTECAO` | Coluna sensível sem indício de hash, cifra ou tipo binário. É indício, não prova: o schema não mostra a cifra feita na aplicação. |
| `PESSOAL_EM_LOG` | Dado pessoal em tabela de log, auditoria ou histórico. |
| `INDICIO_MENOR` | Coluna de responsável legal ou menor de idade, ou tabela de alunos. |

## Precisão e recall

**Leia isto antes dos números.** Eu escrevi os schemas de teste, os gabaritos *e* as regras. Um classificador por nome de coluna afinado nos nomes que o próprio autor conhece vai bem nesses nomes. Por isso há três corpora, e só um deles mede generalização de verdade.

| Corpus | O que é | Como ler |
|---|---|---|
| **Desenvolvimento** (5 domínios fictícios: e-commerce, clínica, RH, escola, fintech) | Schemas meus. As regras foram escritas conhecendo esses nomes. | **Otimista.** Serve para pegar regressão, não para prometer nada. |
| **Validação** (outros 5 schemas fictícios, congelados) | Schemas meus, com armadilhas (abreviações, inglês, nomes opacos, tabelas de referência). Gabarito escrito antes das regras. Rodado uma vez. | **Também otimista:** as regras não foram ajustadas olhando para ele, mas eu conhecia os nomes. |
| **Externo** (Sakila, Employees, WordPress) | Schemas públicos que **não escrevi**. Gabarito escrito antes de rodar. | **A única medida fora da minha autoria.** Só a *primeira rodada* vale como generalização: depois dela eu ajustei regras olhando os erros. |

Colunas com "depende" no gabarito ficam fora de todas as métricas e são listadas à parte. A métrica binária conta o "depende" da Tarja como positivo, porque deixar passar dado pessoal é pior do que marcar a mais.

### Dado pessoal vs não pessoal (a métrica que importa na prática)

| Corpus | Colunas avaliadas | Precisão | Recall | Falsos negativos |
|---|---:|---:|---:|---:|
| Desenvolvimento | 373 | 100% | 97% | 5 |
| Validação (execução 1) | 247 | 100% | 99% | 1 |
| **Externo, primeira rodada (fora da amostra)** | 137 | **90%** | **76%** | **8** |
| Externo, depois do ajuste 1 *(não vale como generalização)* | 137 | 100% | 88% | 4 |

**A leitura honesta:** fora dos nomes que eu conheço, a Tarja deixou passar cerca de **1 em cada 4** colunas com dado pessoal. Em schemas com nomes opacos ou fora do padrão ela vai errar mais. Uma coluna marcada "não identificado" significa **"a Tarja não achou pista"**, não "não tem dado pessoal".

### Por categoria

Corpus de **desenvolvimento** (otimista):

| Categoria | Suporte | Precisão | Recall |
|---|---:|---:|---:|
| Identificador direto | 58 | 100% | 97% |
| Localização | 28 | 100% | 100% |
| Financeiro | 27 | 100% | 96% |
| Sensível | 29 | 100% | 93% |
| Criança/adolescente (indício) | 5 | 100% | 100% |
| Outro dado pessoal | 26 | 100% | 100% |
| Não identificado | 200 | 98% | 100% |

Corpus **externo, primeira rodada** (fora da amostra):

| Categoria | Suporte | Precisão | Recall |
|---|---:|---:|---:|
| Identificador direto | 21 | 90% | 86% |
| Localização | 5 | 83% | 100% |
| Financeiro | 1 | 100% | 100% |
| **Outro dado pessoal** | 7 | 100% | **29%** |
| Não identificado | 103 | 93% | 97% |
| Sensível | 0 | n/d | n/d |
| Criança/adolescente | 0 | n/d | n/d |

**Categorias fracas, sem maquiagem:**

- **Outro dado pessoal:** é a mais fraca fora da amostra (recall 29% na primeira rodada). São colunas de nome comum: `hire_date`, `title` (cargo), `picture`, `user_url`. Não há palavra que as denuncie.
- **Sensível e criança/adolescente não têm medida independente.** Os três schemas públicos que usei não têm essas colunas, então os números dessas categorias vêm só dos meus schemas fictícios (29 e 5 colunas no desenvolvimento). São poucas colunas: desconfie dos 100%.
- **`SEM_CICLO_DE_VIDA` dispara demais fora dos meus schemas** (precisão 25% na primeira rodada do externo): `create_date`, `last_update` e `from_date` não contam como data de criação.

### Falsos negativos e positivos conhecidos

As listas completas, com o motivo de cada erro, estão em [`docs/results/`](docs/results/) (falsos negativos de dado pessoal primeiro):

- [`external-primeira-rodada.md`](docs/results/external-primeira-rodada.md): o resultado fora da amostra, antes de qualquer ajuste.
- [`dev.md`](docs/results/dev.md) e [`validation.md`](docs/results/validation.md).
- [`historico-de-ajustes.md`](docs/results/historico-de-ajustes.md): toda mudança de regra depois de uma rodada, com o motivo, e os erros da validação que **não** foram corrigidos de propósito.
- [`docs/validation-runs.md`](docs/validation-runs.md): quantas vezes o corpus de validação rodou e em qual commit. O corpus é protegido por hash (`docs/validation-frozen.json`); um teste falha se alguém mexer nele.

Exemplos de erros reais: `cd_cid` (CID com prefixo de código) virou "chave" e passou; `nm_cidade` foi lida como nome de pessoa; `emp_no` (número do empregado) e `user_nicename` (WordPress) passaram sem marcação.

## Limitações (o que a Tarja NÃO faz)

- **Só MySQL, só `CREATE TABLE`.** `ALTER TABLE`, views, triggers, procedimentos e outros bancos (Postgres etc.) ficam de fora. O parser reconhece e lista o que ignorou.
- **Heurística por nome.** Não olha dado nenhum, só o schema: nome da coluna, tipo, `COMMENT` e nome da tabela. Coluna com nome opaco (`campo1`, `info`) só é pega se o `COMMENT` ajudar.
- **Não sabe o que a aplicação faz.** Cifra, mascaramento e controle de acesso feitos no código não aparecem no schema.
- **Não conhece o seu negócio.** Finalidade, base legal e retenção são seus.
- **Texto livre** (`observacao`, `descricao`) pode ter qualquer dado pessoal dentro. A Tarja só avisa.
- **Português e inglês.** Outros idiomas não têm vocabulário.
- **Dicionário pequeno de vida funcional, cargos e datas.** É aí que mais erra.

## Decisões técnicas

- **Parser próprio** (`lib/sql/`), em TypeScript puro, sem DOM, sem React e sem biblioteca de parser. Tokenizador linear, sem regex com quantificador aninhado (sem backtracking catastrófico). Erro de sintaxe nunca derruba: mostra o trecho e analisa o que dá. Limites de tabelas, colunas, identificador e de entrada (1 MB medido em **bytes UTF-8**).
- **Regras como dados** (`lib/lgpd/rules/`), funções pequenas e puras no motor. Sem `Math.random`, `Date.now` nem `new Date()` (um teste varre o código).
- **Privacidade por construção:** o motor não faz rede. Um teste estático proíbe `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `innerHTML`, `localStorage` e afins no código da aplicação, e um teste em execução intercepta essas APIs e confirma zero chamadas. A CSP restritiva (`connect-src 'none'`), a página "como verificar" e o deploy vêm com a interface.
- **Exportação segura:** CSV com proteção contra injeção de fórmula em planilha; Markdown com escape de `|`, quebra de linha e HTML.
- **Testes:** Vitest e fast-check. Suíte rápida (`npm test`) em todo commit; suíte lenta (`npm run test:slow`: corpus, 1 MB hostil, cobertura com limite de 90/90/85) em job separado do CI.

## Rodando

```bash
npm install
npm test                     # suíte rápida
npm run test:slow            # corpus completo e cobertura com limite mínimo
npm run corpus:metrics       # precisão e recall no corpus de desenvolvimento
npm run corpus:externo       # corpus externo (Sakila, Employees, WordPress)
npm run corpus:validacao     # validação: só em checkpoints; a execução é registrada
```

## Licenças

Código sob MIT. Os schemas em `corpus/external/` são de terceiros e mantêm as licenças originais (ver [`corpus/external/NOTICE.md`](corpus/external/NOTICE.md)).
