# Validação v1 queimada

O corpus `corpus/validation/` (validação v1) **deixou de ser validação**. Ele continua congelado por hash e continua rodando nos testes, mas:

- Rodou uma vez (execução 1, ver `docs/validation-runs.md`) e os dois erros que ele mostrou (`cd_cid`, `nm_cidade`) passaram a orientar uma correção de regra. Corpus que orienta ajuste vira corpus de desenvolvimento.
- Eu escrevi os schemas e conhecia as regras.

O mesmo vale para o **externo v1** (Sakila, Employees, WordPress): depois da primeira rodada, as regras foram ajustadas olhando os erros dele. Ele é corpus de desenvolvimento.

Os resultados antigos **não foram apagados**:

| Corpus | Papel agora | Resultados |
|---|---|---|
| desenvolvimento | desenvolvimento | `dev-primeira-rodada.md`, `dev.md` |
| validação v1 | desenvolvimento (queimado) | `validation.md` (execução 1) |
| externo v1 | desenvolvimento (queimado) | `external-primeira-rodada.md` (fora da amostra na época), `external.md` |
| **validação v2** | validação, congelada, **uma única execução** | a preencher na execução |
| **externo v2** | validação externa, congelada, **uma única execução** | a preencher na execução |

O gabarito da v2 (`corpus/validation-v2/*.gold.txt` e `corpus/external-v2/*.gold.txt`) foi escrito **antes** de qualquer das mudanças de regra desta rodada e congelado num commit. O corpus externo v2 (Northwind, Chinook, OpenEMR) não tem nenhum schema em comum com o externo v1.
