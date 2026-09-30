# DESIGN.md — Tarja

> Como foi feito: o `/design-consultation` interativo (pesquisa de concorrentes, prévias, várias perguntas) **não foi rodado na íntegra**. O conceito já vinha decidido pelo dono do projeto, que pediu para não parar. As decisões abaixo são minhas, com o motivo, e os contrastes foram **calculados** (fórmula WCAG), não estimados.

## Conceito: o documento com tarja preta

O schema aparece como um **documento oficial**. As colunas que guardam dado pessoal ficam cobertas por uma **tarja preta**, como numa censura de processo. Quem quiser saber o que tem ali foca ou clica na tarja, e ela revela categoria, confiança, motivo e sugestão.

O que a pessoa deve lembrar: *"a ferramenta mostra o que o seu banco guarda sobre as pessoas, e não finge saber mais do que sabe."* Por isso a tarja nunca esconde de quem usa leitor de tela nem de quem imprime: ela é forma, não sigilo.

## O que NÃO aparece (proibido)

Cadeado, escudo, olho, azul neon, verde Matrix, gradiente roxo/azul, glassmorphism, emoji como ícone, card com sombra suave, frase tipo "proteja seus dados com IA", imagem de hacker. Nenhuma sombra difusa; bordas retas e réguas finas.

## Cor

Uma cor de destaque só, **laranja de sinalização, usada apenas para dado sensível**. O resto é papel e tinta.

| Token | Valor | Uso | Contraste (calculado) |
|---|---|---|---|
| `--papel` | `#F3EFE4` | fundo da página | — |
| `--papel-2` | `#E9E3D2` | faixas e áreas de apoio | — |
| `--tinta` | `#15130F` | texto principal | 16,2:1 sobre papel |
| `--tinta-suave` | `#4A453C` | texto secundário, bordas de campo | 8,3:1 sobre papel |
| `--mudo` | `#6B6558` | rótulos pequenos, legendas | 5,0:1 sobre papel (AA) |
| `--linha` | `#8A826F` | réguas e contorno de controle | 3,3:1 sobre papel (AA para componente) |
| `--tarja` | `#0E0D0B` | a tarja | papel sobre tarja: 16,9:1 |
| `--sinal` | `#FF6B1A` | preenchimento do carimbo e da borda de sensível | tinta sobre sinal: 6,5:1; sinal sobre tarja: 6,8:1 |
| `--sinal-texto` | `#B93C00` | texto laranja sobre papel | 4,9:1 sobre papel (AA); **não usar sobre `papel-2`** (4,4:1) |

Regras: laranja **nunca** em erro, botão comum, link ou decoração. Erro e aviso usam tinta e sublinhado/negrito. Cor nunca é a única pista: sensível também tem o carimbo "SENSÍVEL" escrito e borda dupla.

## Tipografia (self-hosted: nada de Google Fonts em runtime, por causa da CSP)

Pacotes `@fontsource/*` (licença OFL), servidos do próprio site.

| Papel | Família | Por quê |
|---|---|---|
| Títulos e carimbos | **Barlow Condensed** 600/700, caixa alta, espaçamento 0,08em | Condensada de placa e carimbo oficial, sem cara de tecnologia. |
| Texto corrido | **Source Serif 4** 400/600 | Serifada de documento, legível em parágrafo longo. |
| Nomes de tabela e coluna, tipos, código | **IBM Plex Mono** 400/500 | Mono com cara de formulário e de máquina de escrever limpa. |

Nenhuma é Inter, Roboto, Arial, Space Grotesk ou outra de uso genérico.

Escala (rem): rótulo 0,6875 (caixa alta, tracking 0,12em) · legenda 0,8125 · texto 1 · texto-grande 1,125 · subtítulo 1,5 · título 2,5 a 4 (fluido com `clamp`). Linha 1,55 no texto, 1,2 nos títulos.

## Espaço, forma, movimento

- Grade de 4 px. Passos: 4, 8, 12, 16, 24, 32, 48, 72. Coluna de leitura até 72ch; o documento pode ir até 1120 px.
- Raio **0** em tudo (papel não tem canto arredondado). Bordas de 1 px (régua) e 2 px (tarja e carimbo).
- Movimento: **nenhum essencial**. A revelação da tarja é instantânea. Com `prefers-reduced-motion: no-preference` só há uma transição curta de cor (120 ms) no foco; com `reduce`, zero transição.

## O documento e a tarja (comportamento)

1. **Uma página só.** O resultado aparece na mesma tela, abaixo da entrada. "Como verificar" é uma seção da própria página (com `connect-src 'none'` a navegação client-side do Next não funciona).
2. **Cada coluna pessoal é um `<button>`** com o nome da coluna dentro, coberto por fundo `--tarja` com texto da mesma cor. O texto **está no DOM** e o botão tem `aria-expanded`, então leitor de tela lê "id_cliente, botão, recolhido" e depois o painel. A tarja é só aparência.
3. **Foco por teclado revela** (`:focus-visible` troca a tarja por contorno de 2 px com o texto legível). Enter ou Espaço abre o painel de detalhe.
4. **Coluna sensível** ganha borda dupla em `--sinal` e o carimbo **SENSÍVEL** em `--sinal-texto` (sobre papel) ou `--sinal` (sobre a tarja). É o único uso de laranja.
5. **Coluna "não identificada pelas regras"** não tem tarja: aparece em claro, com carimbo cinza "SEM PISTA". Fica num painel de revisão no topo, com clique para marcar como dado pessoal.
6. **Impressão:** `@media print` revela tudo: tarja vira texto normal, o relatório é uma tabela completa. A tarja nunca imprime escondendo conteúdo.
7. **Celular:** o documento vira lista vertical; o painel de detalhe abre embaixo da linha.

## Tom do texto

Direto, brasileiro, sem juridiquês e sem corporativês: um colega que entende de LGPD explicando. Exemplos: "Isto é apoio, não parecer jurídico." · "Regras, não IA: dá para auditar cada decisão." · "Nada sai do seu navegador." · "Não achei pista" (em vez de "não classificado").

Textos fixos na tela: aviso de escopo; frase de desempenho gerada por `lib/lgpd/medicao.ts`; "Não identificado pelas regras quer dizer que a Tarja não achou pista, não que não há dado pessoal."

## Carimbos (categoria)

Retângulo de 2 px, Barlow Condensed 700, caixa alta, levemente inclinado em −1,5° **só no carimbo principal do cabeçalho** (decorativo, `aria-hidden`). Nos carimbos de categoria, sem inclinação. Texto: IDENTIFICADOR · LOCALIZAÇÃO · FINANCEIRO · CRIANÇA/ADOLESC. · SENSÍVEL · OUTRO DADO PESSOAL · SEM PISTA. Só SENSÍVEL usa laranja.

## Acessibilidade (checklist que a UI cumpre)

- Contraste AA calculado (tabela acima); foco sempre visível (2 px tinta + 2 px papel).
- Navegação completa por teclado; ordem do DOM = ordem visual; `button` de verdade, sem `div` clicável.
- `lang="pt-BR"`; `aria-live="polite"` no resumo do resultado; erros de sintaxe listados com linha e trecho.
- `prefers-reduced-motion`, `prefers-contrast` (aumenta a régua), e impressão revelando tudo.
- Alvos de toque de 44 px no celular.

## Camada "Padrões de DDL (v2)" (adicionada depois)

- Mesma página, mesmo documento: um seletor de duas opções (`aria-pressed`) no topo escolhe LGPD ou padrões de DDL.
- **Severidade sem laranja.** O laranja continua reservado a dado sensível. Na v2, **ERRO** é um carimbo cheio (tinta) e **AVISO** é um carimbo vazado; a palavra está escrita, então a cor nunca é a única pista.
- Cada achado mostra o id da regra, o título, o detalhe e um "Por que esta regra existe" recolhido. As regras ficam num bloco recolhido com aviso de que não são lei.
- O texto do aviso muda conforme a camada ("Isto não é LGPD e não é lei").
