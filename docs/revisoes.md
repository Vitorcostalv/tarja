# Revisões da interface (design e código)

O `/design-review` e o `/review` do gstack **não foram rodados**: os dois dependem de PR e de revisores externos, e você autorizou a revisão por conta própria. Isto é o que eu conferi e corrigi, com evidência. Não houve segunda opinião de outro modelo.

## Design (contra o `DESIGN.md`)

| Conferi | Como | Resultado |
|---|---|---|
| Contraste AA dos tokens | Fórmula WCAG aplicada ao CSS real (`tests/ui/design.test.ts`) | Passa. O laranja de texto (4,9:1) **não** pode ir sobre `papel-2` (4,4:1): há teste. |
| Laranja só em dado sensível | Teste varre os seletores do CSS | Passa. |
| Sem sombra difusa, gradiente, blur, raio | Teste no CSS | Passa. |
| Tarja acessível | Teste: botão com o nome no DOM, `aria-expanded`, nome acessível com categoria e confiança | Passa. |
| Foco por teclado revela a tarja | Navegador real (Edge via CDP): foco + Enter abre o detalhe | Passa (print em `docs/assets/tarja-exemplo.png`). |
| `prefers-reduced-motion`, `forced-colors`, `prefers-contrast` | Teste de CSS | Passa. |
| Impressão revela tudo | Teste de CSS (`@media print`) | Passa no CSS. **Não imprimi de verdade**: confira no seu navegador. |
| Celular (375 px) | Emulação: sem rolagem horizontal, botões de 44 px | Passa. |
| Fontes self-hosted | Teste: nenhuma URL externa no CSS; build sem requisição externa | Passa. |
| Título legível | **Achado:** a primeira versão cobria "TAR" com a tarja e o nome da ferramenta sumia. Corrigido: o nome fica legível e a tarja passa por baixo, como um grifo. | Corrigido. |
| Revisão "sem pista" com ruído | **Achado:** `criado_em`, chaves e booleanos apareciam na lista de revisão. Corrigido: a lista ignora colunas de sistema. | Corrigido. |

## Código

| Problema | Correção |
|---|---|
| Região `aria-live` envolvia o resultado inteiro (o leitor de tela leria tudo a cada mudança) | `aria-live` só num status curto: "Análise pronta: N tabelas...". Teste. |
| Se o Web Worker falhasse, a tela ficava em "Analisando…" para sempre | `onerror` do worker reenvia o pedido na thread principal. |
| `findIndex` por coluna na renderização: O(n²) com milhares de colunas | Índice por soma de prefixos. |
| Milhares de tabelas desenhadas de uma vez travariam a aba | 50 tabelas por vez, com "Mostrar mais"; o relatório tem todas. Teste. |
| Estilo inline (bloqueado por `style-src 'self'`) | Removido: só classes. Teste no HTML gerado. |
| **Hash de script inline na CSP quebraria na Vercel**: o build de lá gera nome de arquivo CSS diferente, o script inline muda e o hash deixa de bater | Achado pelo deploy de preview. Os scripts inline viram arquivos no build; a CSP é só `script-src 'self'`, sem hash. Teste confere que nenhuma página tem script inline. |
| Página 404 padrão do Next tem `<style>` inline | 404 própria, sem estilo inline. |
| Aviso do rodapé e da entrada em texto corrido | Mantido: é o texto fixo exigido. |

## O que NÃO foi verificado

- Leitor de tela real (NVDA/VoiceOver): só a estrutura, por teste. Um teste manual com leitor de tela ainda vale a pena.
- Impressão real (pré-visualização do navegador).
- Safari e Firefox: só Chromium (Edge). O Web Worker e a CSP são padrão, mas não testei.
- Desempenho com 1 MB de DDL na interface (o motor foi medido: 157 ms na minha máquina; a interface desenha 50 tabelas por vez).
