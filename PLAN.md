# Tarja — Plano (aprovado com ajustes)

Raio-X de LGPD para schemas SQL. Apoio, não parecer jurídico. Regras, não IA.
Aprovado em 2026-09-30. Revisão feita por conta própria (o /autoplan não roda sem plano e repositório prévios; não houve segunda opinião de outro modelo).

## Decisões fechadas

| # | Decisão |
|---|---|
| 1 | "Lembrar meu schema" fora do MVP. Nada do schema em storage. |
| 2 | Limite de entrada: 1 MB medido em **bytes UTF-8** (`TextEncoder`), não em caracteres. |
| 3 | Domínio: `tarja-lgpd.vercel.app` (reconfirmar no deploy). Repo e marca: Tarja. |
| 4 | Pasta local fora do OneDrive (o projeto começou dentro dele e foi movido depois, a pedido). |
| 5 | Commits só com a identidade do usuário (`Vitim` / `143446454+Vitorcostalv@users.noreply.github.com`). Sem `Co-Authored-By` e sem rodapé do Claude. |
| 6 | Web Worker só se a medição justificar (~50 ms em 1 MB), medida também com CPU 4x mais lenta. |
| 7 | Cobertura mínima em `lib/`: 90% linhas/funções/statements, 85% branches. Falha o comando. |
| 8 | Base legal só como hipótese por categoria. Retenção: "a definir pelo controlador". |

## Ajustes A–G (do usuário)

- **A. CSP:** `output: 'export'` ignora headers do `next.config`. A CSP mora no `vercel.json`; o teste lê esse arquivo. Hashes de scripts inline gerados no build e testados contra o `out/` gerado. `connect-src 'none'` quebra o fetch de navegação client-side do Next: app de **uma página só** (o "como verificar" é uma seção). Validar no preview com o console aberto, zero violação.
- **B. Corpus:** gabaritos dos dois corpora (desenvolvimento e validação) escritos **antes** das regras. Validação congelada num commit, rodada só em checkpoints, com contagem em `docs/`. Métricas: precisão/recall por categoria **e** binária pessoal vs não pessoal. Prioridade ao recall de dado pessoal; falsos negativos listados primeiro.
- **C. Parser:** tokenizador linear, sem regex com quantificador aninhado. Limites de tabelas, colunas e tamanho de identificador, com mensagem. Propriedade "nunca lança nem trava" com limite de tempo e casos hostis (1 MB em uma linha, milhares de parênteses, aspas e comentários sem fechar).
- **D. Saída segura:** CSV: prefixo contra fórmula em células que começam com `= + - @`, tab ou CR. Markdown: escapar `|`, quebras de linha e HTML. UI: nomes só como texto. Teste estático proíbe `innerHTML` e `dangerouslySetInnerHTML`.
- **E. Impressão:** tabela do relatório com tudo revelado. A tarja nunca imprime escondendo conteúdo.
- **F. Exemplo:** botão "Usar schema de exemplo" (clínica fictícia, com dado sensível), o mesmo do print do README, sem cara de empresa real.
- **G. Produção:** `curl -I` confirma a CSP com `connect-src 'none'`; aba Rede sem requisições; console sem violação.

## Ordem

1. Pesquisa (`docs/research/`). **Feito.**
2. Scaffold + git. **Feito.**
3. Parser (`lib/sql`) + testes + propriedades.
4. Corpus de desenvolvimento e de validação, com gabaritos à mão, **antes das regras**.
5. Regras (`lib/lgpd/rules/pt-br.ts`), classificador, achados, sugestões, relatório, exportações + testes.
6. Métricas do corpus (README) + segurança (teste estático de rede).
7. **PARADA: revisão do usuário** (antes da UI).
8. `/design-consultation`, UI, CSP, preview (com confirmação), `/design-review`, `/review`.
9. Repo público (confirmação) → `vercel --prod` (confirmação) → teste final.
