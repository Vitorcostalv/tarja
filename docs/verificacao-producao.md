# Verificação da produção (https://tarja-lgpd.vercel.app)

Feita em 2026-09-30, logo depois do `vercel deploy --prod`, num Edge real (Chromium) dirigido por DevTools Protocol.

## Cabeçalhos (`curl -I`)

```
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; worker-src 'self'; manifest-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
Strict-Transport-Security: max-age=63072000; includeSubDomains
```

`connect-src 'none'` presente. Nenhum script inline na página (`curl | grep -c "<script>"` dá 0).

## Fluxo no navegador

1. Carga da página: 22 requisições, todas do próprio site (HTML, scripts, CSS, fontes).
2. Clique em "Usar schema de exemplo": a análise roda no Web Worker; a única requisição nova é uma fonte do próprio site (carregada sob demanda).
3. Schema colado à mão (`segredo_xyz`, com CPF, e-mail e diagnóstico) e analisado: **nenhuma requisição nova**.
4. Exportar JSON: gera arquivo local (`blob:`), nenhuma requisição.
5. URL depois de tudo: `https://tarja-lgpd.vercel.app/`, sem hash nem query. `localStorage` e `sessionStorage` vazios.

## Tentativas deliberadas de enviar dado para fora (de dentro da página)

| Tentativa | Resultado |
|---|---|
| `fetch("https://example.com/")` | bloqueado: `violates ... "connect-src 'none'"` |
| `XMLHttpRequest` | bloqueado pela CSP |
| `navigator.sendBeacon` | bloqueado pela CSP (retorna `true` porque só enfileira; o teste isolado não mostrou nenhuma requisição saindo) |
| `WebSocket("wss://example.com/")` | bloqueado pela CSP |

Nenhum erro de console além dessas tentativas provocadas. Nenhuma violação de CSP vinda da própria página.

## O que isto não prova

Que não exista nenhum bug de hidratação em Safari ou Firefox (não testados), nem que a Vercel não registre o acesso à página em si (logs de borda da hospedagem existem; o **conteúdo do schema** nunca chega lá).
