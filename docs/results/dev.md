# Resultado do corpus: dev

Colunas: 397 (373 avaliadas, 24 com "depende" fora das métricas).
Acerto exato de categoria: 97%.
Subtipo de dado sensível certo: 26 de 29.

| Categoria | Suporte | Precisão | Recall | F1 |
|---|---:|---:|---:|---:|
| Sensível | 29 | 100% | 93% | 96% |
| Criança/adolescente (indício) | 5 | 100% | 100% | 100% |
| Identificador direto | 58 | 100% | 97% | 98% |
| Localização | 28 | 100% | 100% | 100% |
| Financeiro | 27 | 100% | 96% | 98% |
| Outro dado pessoal | 26 | 72% | 100% | 84% |
| Não identificado | 200 | 99% | 97% | 98% |
| **Dado pessoal vs não pessoal** (binária) | 173 | 96% | 99% | 97% |

Contagens da métrica binária: VP 171, FP 7, FN 2. "depende" da Tarja conta como positivo.

## Erros, com os falsos negativos de dado pessoal primeiro

### Falsos negativos de dado pessoal (passou sem marcar) (2)

- `escola` · `bolsas.comprovante_url`: gabarito **financeiro**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `rh` · `atestados_medicos.arquivo_url`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal

### Falsos positivos (marcou dado pessoal onde o gabarito diz que não é) (7)

- `clinica` · `auditoria_prontuario.acao`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "auditoria_prontuario" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `clinica` · `auditoria_prontuario.ocorreu_em`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "auditoria_prontuario" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `ecommerce` · `pagamentos.bandeira`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "pagamentos" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `ecommerce` · `pagamentos.metodo`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "pagamentos" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `ecommerce` · `pagamentos.valor`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "pagamentos" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `escola` · `usuarios_portal.perfil`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "usuarios_portal" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `escola` · `usuarios_portal.ultimo_acesso`: gabarito **nao_identificado**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "usuarios_portal" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)

### Pessoal nos dois lados, categoria errada (3)

- `clinica` · `pacientes.alergias`: gabarito **sensivel:saude**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "pacientes" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `fintech` · `documentos_kyc.arquivo_frente_url`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "documentos_kyc" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `fintech` · `documentos_kyc.arquivo_verso_url`: gabarito **identificador_direto**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "documentos_kyc" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)

## Achados estruturais

| Achado | VP | FP | FN | Precisão | Recall |
|---|---:|---:|---:|---:|---:|
| INDICIO_MENOR | 3 | 0 | 0 | 100% | 100% |
| PESSOAL_EM_LOG | 5 | 0 | 0 | 100% | 100% |
| SEM_CICLO_DE_VIDA | 7 | 0 | 0 | 100% | 100% |
| SENSIVEL_SEM_PROTECAO | 27 | 0 | 3 | 100% | 90% |
| TEXTO_LIVRE | 3 | 0 | 0 | 100% | 100% |

### Achados que faltaram

- `clinica` · SENSIVEL_SEM_PROTECAO · `pacientes.alergias`
- `rh` · SENSIVEL_SEM_PROTECAO · `atestados_medicos.arquivo_url`
- `rh` · SENSIVEL_SEM_PROTECAO · `atestados_medicos.observacao`

### Achados a mais

Nenhum.

### Colunas com "depende" no gabarito (fora das métricas) (24)

- `clinica` · `consultas.valor_cobrado`: gabarito **financeiro**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `clinica` · `pacientes.numero_carteirinha`: gabarito **sensivel:saude**, a Tarja disse **sensivel** (baixa). o nome da coluna contém "possível dado de saúde"
- `clinica` · `pacientes.observacoes`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "pacientes" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `clinica` · `pacientes.plano_saude`: gabarito **sensivel:saude**, a Tarja disse **sensivel** (alta). o nome da coluna é "saúde"
- `clinica` · `unidades.cnpj`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (media). o nome da coluna é "CNPJ"
- `ecommerce` · `avaliacoes.comentario`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `ecommerce` · `clientes.senha_hash`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `ecommerce` · `logs_acesso.user_agent`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (alta). o nome da coluna é "identificador de dispositivo"
- `ecommerce` · `pedidos.observacao`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `escola` · `notas.nota`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `escola` · `ocorrencias.descricao`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `escola` · `ocorrencias.providencias`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `escola` · `usuarios_portal.senha_hash`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `fintech` · `audit_log.payload`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `fintech` · `dispositivos.push_token`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `fintech` · `emprestimos.motivo_recusa`: gabarito **financeiro**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `fintech` · `emprestimos.taxa_juros_mes`: gabarito **financeiro**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `fintech` · `parceiros.cnpj`: gabarito **identificador_direto**, a Tarja disse **identificador_direto** (media). o nome da coluna é "CNPJ"
- `fintech` · `transacoes.descricao`: gabarito **outro_dado_pessoal**, a Tarja disse **outro_dado_pessoal** (baixa). contexto da tabela: "transacoes" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)
- `fintech` · `usuarios.pep`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `fintech` · `usuarios.pin_hash`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `fintech` · `usuarios.senha_hash`: gabarito **nao_identificado**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `rh` · `atestados_medicos.observacao`: gabarito **sensivel:saude**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
- `rh` · `ponto_registros.registrado_em`: gabarito **outro_dado_pessoal**, a Tarja disse **nao_identificado** (baixa). nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal
