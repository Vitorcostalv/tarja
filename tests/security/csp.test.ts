import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hashDeScript, montarCsp, scriptsInline } from "../../lib/csp";

/**
 * A CSP é a prova de que a página não consegue enviar dado para fora.
 * 1) Lê o vercel.json de verdade (com output: 'export' os headers do next.config não valem).
 * 2) Confere os hashes contra o out/ gerado pelo build, não contra valor fixo.
 */
interface Cabecalho {
  key: string;
  value: string;
}
const config = JSON.parse(readFileSync("vercel.json", "utf8")) as { headers: Array<{ source: string; headers: Cabecalho[] }> };
const cabecalhos = Object.fromEntries((config.headers[0]?.headers ?? []).map((h) => [h.key, h.value]));
const csp = cabecalhos["Content-Security-Policy"] ?? "";
const diretiva = (nome: string) => csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${nome} `)) ?? "";

describe("vercel.json: cabeçalhos de segurança", () => {
  it("vale para todas as rotas", () => {
    expect(config.headers).toHaveLength(1);
    expect(config.headers[0]!.source).toBe("/(.*)");
  });

  it("CSP proíbe qualquer conexão de saída: connect-src 'none'", () => {
    expect(diretiva("connect-src")).toBe("connect-src 'none'");
  });

  it("CSP começa negando tudo (default-src 'none') e libera só o necessário", () => {
    expect(diretiva("default-src")).toBe("default-src 'none'");
    expect(diretiva("script-src")).toBe("script-src 'self'"); // sem hash e sem inline
    expect(diretiva("style-src")).toBe("style-src 'self'");
    expect(diretiva("img-src")).toBe("img-src 'self' data:");
    expect(diretiva("font-src")).toBe("font-src 'self'");
    expect(diretiva("worker-src")).toBe("worker-src 'self'");
  });

  it("sem 'unsafe-inline', 'unsafe-eval' nem curinga em nenhuma diretiva", () => {
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|unsafe-hashes/);
    expect(csp).not.toMatch(/\*/);
    expect(csp).not.toMatch(/https?:/);
  });

  it("proíbe formulário, base, moldura e plugin", () => {
    expect(diretiva("form-action")).toBe("form-action 'none'");
    expect(diretiva("base-uri")).toBe("base-uri 'none'");
    expect(diretiva("frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(diretiva("object-src")).toBe("object-src 'none'");
  });

  it("demais cabeçalhos de segurança", () => {
    expect(cabecalhos["Referrer-Policy"]).toBe("no-referrer");
    expect(cabecalhos["X-Content-Type-Options"]).toBe("nosniff");
    expect(cabecalhos["X-Frame-Options"]).toBe("DENY");
    expect(cabecalhos["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(cabecalhos["Permissions-Policy"]).toMatch(/camera=\(\)/);
    expect(cabecalhos["Strict-Transport-Security"]).toMatch(/max-age=\d+/);
  });
});

describe("csp: funções", () => {
  it("scriptsInline ignora script com src e script vazio", () => {
    const html = '<script src="/a.js"></script><script>ola()</script><script async src="/b.js"></script><script>  </script>';
    expect(scriptsInline(html)).toEqual(["ola()"]);
  });

  it("hashDeScript usa SHA-256 em base64 entre aspas", () => {
    expect(hashDeScript("")).toBe("'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='");
  });

  it("montarCsp não depende de build: a CSP é sempre a mesma", () => {
    expect(montarCsp()).toBe(montarCsp());
    expect(diretivaDe(montarCsp(), "script-src")).toBe("script-src 'self'");
  });
});

function diretivaDe(valor: string, nome: string): string {
  return valor.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${nome} `)) ?? "";
}

function htmls(dir: string): string[] {
  const out: string[] = [];
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) out.push(...htmls(p));
    else if (nome.endsWith(".html")) out.push(p);
  }
  return out;
}

describe("CSP contra o build gerado (out/)", () => {
  const temBuild = existsSync("out/index.html");
  // No CI o build roda antes dos testes: sem out/ o teste FALHA em vez de pular.
  it("existe um build para conferir", () => {
    if (!temBuild && process.env.CI) throw new Error("rode `npm run build` antes dos testes no CI");
    expect(true).toBe(true);
  });

  it.skipIf(!temBuild)("nenhuma página tem script inline: todos viraram arquivo do próprio site", () => {
    let externalizados = 0;
    for (const f of htmls("out")) {
      const html = readFileSync(f, "utf8");
      expect(scriptsInline(html), `${f} ainda tem script inline (rode npm run build)`).toEqual([]);
      externalizados += [...html.matchAll(/<script src="\/_next\/static\/inline\/[0-9a-f]{16}\.js"/g)].length;
    }
    expect(externalizados).toBeGreaterThan(0);
  });

  it.skipIf(!temBuild)("o conteúdo dos scripts externalizados existe em out/_next/static/inline", () => {
    const arquivos = readdirSync("out/_next/static/inline");
    expect(arquivos.length).toBeGreaterThan(0);
    for (const a of arquivos) expect(readFileSync(join("out/_next/static/inline", a), "utf8").length).toBeGreaterThan(0);
  });

  it.skipIf(!temBuild)("o HTML gerado não tem nada que a CSP bloquearia: style inline, handler inline, javascript:", () => {
    for (const f of htmls("out")) {
      const html = readFileSync(f, "utf8");
      expect(html, f).not.toMatch(/<style[\s>]/i);
      expect(html, f).not.toMatch(/\sstyle="/i);
      expect(html, f).not.toMatch(/\son[a-z]+="/i);
      expect(html, f).not.toMatch(/javascript:/i);
    }
  });

  it.skipIf(!temBuild)("o HTML gerado não carrega nada de fora: nenhum src/href para outro domínio", () => {
    for (const f of htmls("out")) {
      const html = readFileSync(f, "utf8");
      const externos = [...html.matchAll(/\b(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]!);
      // Só links de navegação (<a href>) podem apontar para fora; nunca recurso carregado.
      const recursos = [...html.matchAll(/<(?:script|link|img|iframe|source|video|audio|embed|object)\b[^>]*\b(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]!);
      expect(recursos, `${f} carrega recurso externo: ${recursos.join(", ")}`).toEqual([]);
      expect(externos.every((u) => !/\.(js|css|woff2?|png|jpg|svg)(\?|$)/.test(u)), f).toBe(true);
    }
  });

  it.skipIf(!temBuild)("a meta og:image é estática e aponta para o próprio site", () => {
    const html = readFileSync("out/index.html", "utf8");
    expect(html).toMatch(/property="og:image" content="https:\/\/tarja-lgpd\.vercel\.app\/og\.png"/);
    expect(existsSync("out/og.png")).toBe(true);
  });
});
