# Execuções dos corpora v2 (validação e externo)

Estes corpora foram escritos e congelados antes das mudanças de regra que eles avaliam, e cada um roda **uma única vez**.
Uma segunda execução (`--reexecutar`) fica registrada como tal e tira o valor de validação do corpus.

| # | Corpus | Data | Commit | Precisão binária | Recall binário | FN de dado pessoal | Observação |
|---:|---|---|---|---:|---:|---:|---|
| 1 | validation-v2 | 2026-09-30 | f40c035 | 87% | 94% | 6 | primeira e única execução |
| 2 | external-v2 | 2026-09-30 | f40c035 | 73% | 90% | 14 | primeira e única execução |
