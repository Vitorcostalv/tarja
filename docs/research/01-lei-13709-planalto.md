# Lei 13.709/2018 (LGPD) — texto oficial

- **URL:** https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- **Acessado em:** 2026-09-30 (download direto da página, texto lido e conferido; não é resumo de terceiros)
- **Observação:** o texto do Planalto traz a redação atualizada, com alterações posteriores (ex.: Lei 13.853/2019 no art. 7º, VIII). Os trechos abaixo são transcrições curtas para rastrear cada regra; a fonte de verdade é a página.

Os IDs à direita são usados no campo `fonte` das regras em `lib/lgpd/rules/`.

| ID | Artigo | O que diz (transcrição curta) | O que a Tarja extrai |
|---|---|---|---|
| `LGPD-5-I` | Art. 5º, I | dado pessoal: "informação relacionada a pessoa natural identificada ou identificável" | Base da categoria "identificador direto" e de localização. Pessoa jurídica fica de fora (nota do CNPJ). |
| `LGPD-5-II` | Art. 5º, II | dado pessoal sensível: "dado pessoal sobre origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou a organização de caráter religioso, filosófico ou político, dado referente à saúde ou à vida sexual, dado genético ou biométrico, quando vinculado a uma pessoa natural" | **Lista fechada** de sensíveis. CPF, RG, CNH, e-mail, endereço e dado financeiro **não** estão nela. Por isso a Tarja não os marca como sensíveis. |
| `LGPD-5-XI` | Art. 5º, XI | anonimização: dado "perde a possibilidade de associação, direta ou indireta, a um indivíduo" | Distinção entre anonimizar e pseudonimizar nas sugestões. |
| `LGPD-5-XVII` | Art. 5º, XVII | RIPD: documentação com descrição dos processos de tratamento que podem gerar riscos e as medidas de mitigação | O relatório é insumo do RIPD, não o RIPD. |
| `LGPD-6-III` | Art. 6º, III | necessidade: "limitação do tratamento ao mínimo necessário" | Sugestão de minimização ("você precisa mesmo coletar isso?"). |
| `LGPD-6-VII` | Art. 6º, VII | segurança: medidas técnicas e administrativas aptas a proteger os dados | Sugestões de proteção. |
| `LGPD-7` | Art. 7º, I a X | bases legais para dado pessoal (consentimento, obrigação legal, execução de contrato, legítimo interesse, proteção do crédito etc.) | Hipóteses de base legal por categoria, sempre marcadas como hipótese. |
| `LGPD-11` | Art. 11 | bases legais para dado sensível (consentimento "específico e destacado", obrigação legal, tutela da saúde etc.) | Hipóteses para sensíveis. |
| `LGPD-12` | Art. 12 | dado anonimizado não é dado pessoal, salvo se a anonimização for reversível com esforço razoável | Nota: hash sem sal de dado de baixa entropia (ex.: CPF) é reversível por força bruta, logo segue sendo dado pessoal. |
| `LGPD-13-4` | Art. 13, § 4º | pseudonimização: o dado "perde a possibilidade de associação, direta ou indireta, a um indivíduo, senão pelo uso de informação adicional mantida separadamente pelo controlador" | Definição usada nas sugestões de pseudonimização e tokenização. |
| `LGPD-14` | Art. 14, caput e § 1º | tratamento de dado de criança e adolescente "em seu melhor interesse"; de criança, com "consentimento específico e em destaque" de pelo menos um dos pais ou responsável | Achado "indícios de dado de menor". A Tarja só aponta indício, nunca afirma. |
| `LGPD-15` | Art. 15 | término do tratamento (finalidade alcançada, fim do período, pedido do titular, ordem da ANPD) | Achado de tabela sem data de criação/exclusão lógica. |
| `LGPD-16` | Art. 16 | dados "serão eliminados após o término de seu tratamento", com exceções (obrigação legal, pesquisa etc.) | Idem. **A lei não fixa prazo de retenção geral**: por isso o campo fica "a definir pelo controlador". |
| `LGPD-37` | Art. 37 | "O controlador e o operador devem manter registro das operações de tratamento de dados pessoais" | Justifica o relatório de mapeamento como rascunho de registro. |
| `LGPD-38` | Art. 38 e parágrafo único | a ANPD pode determinar RIPD; conteúdo mínimo: tipos de dados coletados, metodologia de coleta e segurança, análise de medidas e mitigação | O relatório cobre "tipos de dados". O resto é do controlador. |
| `LGPD-46` | Art. 46, caput | agentes devem adotar "medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais" | Sugestões de proteção. |

## O que NÃO foi confirmado aqui

- Prazos de retenção específicos (fiscal, trabalhista, prontuário médico etc.) vêm de **outras leis**, não da LGPD. A Tarja não sugere prazo nenhum. Isso é decisão do controlador com apoio jurídico.
