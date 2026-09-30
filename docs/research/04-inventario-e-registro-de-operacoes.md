# Inventário de dados / registro das operações de tratamento

**Situação: só parcialmente confirmado. Não há regra do classificador que dependa deste arquivo.**

## O que está confirmado

- O dever de registro está no **art. 37 da LGPD** (ver `01-lei-13709-planalto.md`, `LGPD-37`). Texto lido direto no Planalto.

## O que NÃO consegui confirmar (tentei em 2026-09-30)

| Fonte | URL | Resultado |
|---|---|---|
| ANPD, modelo de registro simplificado de operações para agentes de pequeno porte (ATPP) | https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-modelo-de-registro-simplificado-de-operacoes-com-dados-pessoais-para-agentes-de-tratamento-de-pequeno-porte-atpp | **HTTP 401** ao baixar. Só sei que existe pelo título que aparece na busca. Não li o conteúdo e não sei quais campos o modelo tem. |
| Governo Digital (SGD), Guia de Elaboração de Inventário de Dados Pessoais | https://www.gov.br/governodigital/pt-br/privacidade-e-seguranca/ppsi/guia_inventario_dados_pessoais.pdf | **HTTP 404** (também em 3 variações da URL). Não li. |

Além disso, o guia do Governo Digital é voltado a órgãos do Poder Executivo federal (SISP), **não** é da ANPD. Mesmo que eu consiga abrir depois, isso precisa ficar claro.

## Consequência para o produto

As colunas do relatório (tabela, coluna, categoria, finalidade, base legal, retenção, proteção) foram escolhidas a partir do art. 37 e do conteúdo mínimo do RIPD (art. 38, parágrafo único), **não** copiadas de um modelo oficial de ROPA. O README diz isso: o relatório é um rascunho e **não segue um modelo oficial específico**.

## Pendência

Reabrir as duas URLs (manualmente no navegador, se preciso) e comparar os campos do modelo oficial com as colunas do relatório antes da versão pública.
