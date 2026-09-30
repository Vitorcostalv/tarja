/**
 * Política de segurança de conteúdo (CSP) e demais cabeçalhos da Tarja.
 *
 * Funciona como prova de que a página NÃO consegue enviar dado para fora: `connect-src 'none'`
 * proíbe fetch, XHR, WebSocket e beacon. Vai no vercel.json (com `output: 'export'` os headers do
 * next.config não valem).
 *
 * `script-src 'self'` puro, sem hash: scripts/gerar-csp.ts tira os scripts inline das páginas e os grava
 * como arquivos. (A primeira versão usava hash dos scripts inline, mas o build da Vercel gerou um nome de
 * arquivo CSS diferente do meu, o script inline mudou e o hash deixou de bater: a página quebraria.)
 */
import { createHash } from "node:crypto";

export function hashDeScript(conteudo: string): string {
  return `'sha256-${createHash("sha256").update(conteudo, "utf8").digest("base64")}'`;
}

/** Scripts inline de um HTML (sem atributo src), exatamente como o navegador os vê. */
export function scriptsInline(html: string): string[] {
  const out: string[] = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
  for (const m of html.matchAll(re)) {
    const atributos = m[1] ?? "";
    if (/\bsrc\s*=/.test(atributos)) continue;
    const corpo = m[2] ?? "";
    if (corpo.trim() === "") continue;
    out.push(corpo);
  }
  return out;
}

export function montarCsp(): string {
  return [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'none'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "form-action 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join("; ");
}

export interface CabecalhoHttp {
  key: string;
  value: string;
}

export function cabecalhosDeSeguranca(csp: string): CabecalhoHttp[] {
  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "Referrer-Policy", value: "no-referrer" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  ];
}

export function montarVercelJson(): string {
  const config = {
    framework: null,
    outputDirectory: "out",
    buildCommand: "npm run build",
    headers: [{ source: "/(.*)", headers: cabecalhosDeSeguranca(montarCsp()) }],
  };
  return JSON.stringify(config, null, 2) + "\n";
}
