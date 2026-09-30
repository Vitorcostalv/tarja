import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { analisarDdl } from "../../lib/lgpd/analyze";
import { deJson, paraCsv, paraJson, paraMarkdown } from "../../lib/lgpd/export";
import { gerarRelatorio } from "../../lib/lgpd/report";

/**
 * Privacidade por construção: o schema não pode sair do navegador.
 * 1) Varredura estática: o código da aplicação não pode nem mencionar API de rede, storage ou injeção de HTML.
 * 2) Teste em execução: com as APIs de rede interceptadas, processar um schema não faz nenhuma chamada.
 */

const PASTAS_DA_APLICACAO = ["lib", "app", "components", "workers"];

function arquivos(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) out.push(...arquivos(p));
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(nome)) out.push(p);
  }
  return out;
}

/** Remove comentários e strings para não acusar a palavra dentro de texto de documentação. */
function semComentarios(codigo: string): string {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const PROIBIDOS: Array<[RegExp, string]> = [
  [/\bfetch\s*\(/, "fetch()"],
  [/\bXMLHttpRequest\b/, "XMLHttpRequest"],
  [/\bsendBeacon\b/, "navigator.sendBeacon"],
  [/\bWebSocket\b/, "WebSocket"],
  [/\bEventSource\b/, "EventSource"],
  [/\bnew\s+Image\s*\(/, "new Image() (beacon por imagem)"],
  [/\bimportScripts\s*\(/, "importScripts()"],
  [/\bRTCPeerConnection\b/, "RTCPeerConnection"],
  [/\binnerHTML\b/, "innerHTML"],
  [/\bouterHTML\b/, "outerHTML"],
  [/\binsertAdjacentHTML\b/, "insertAdjacentHTML"],
  [/\bdangerouslySetInnerHTML\b/, "dangerouslySetInnerHTML"],
  [/\bdocument\.write\b/, "document.write"],
  [/\beval\s*\(/, "eval()"],
  [/\bnew\s+Function\s*\(/, "new Function()"],
  [/\blocalStorage\b/, "localStorage"],
  [/\bsessionStorage\b/, "sessionStorage"],
  [/\bindexedDB\b/, "indexedDB"],
  [/\bdocument\.cookie\b/, "document.cookie"],
  [/\b(?:gtag|ga|dataLayer|plausible|posthog|mixpanel|amplitude|segment|sentry|datadog|hotjar|clarity)\s*[(.]/i, "analytics/telemetria"],
  [/from\s+["'](?:@vercel\/analytics|@vercel\/speed-insights|@sentry\/|posthog|mixpanel|amplitude|react-ga)/, "pacote de analytics"],
];

describe("segurança: varredura estática do código da aplicação", () => {
  const todos = PASTAS_DA_APLICACAO.flatMap(arquivos);

  it("existe código para varrer", () => {
    expect(todos.length).toBeGreaterThan(10);
  });

  for (const [regex, nome] of PROIBIDOS) {
    it(`nenhum arquivo usa ${nome}`, () => {
      const achados = todos.filter((f) => regex.test(semComentarios(readFileSync(f, "utf8"))));
      expect(achados, `encontrado em: ${achados.join(", ")}`).toEqual([]);
    });
  }

  it("nenhuma importação de módulo de rede do Node no código da aplicação", () => {
    const re = /from\s+["'](?:node:)?(?:http|https|net|tls|dgram|dns|http2)["']/;
    expect(todos.filter((f) => re.test(readFileSync(f, "utf8")))).toEqual([]);
  });

  it("nenhuma URL absoluta http(s) no código da aplicação (fora de comentários)", () => {
    const re = /["'`]https?:\/\//;
    const achados = todos.filter((f) => re.test(semComentarios(readFileSync(f, "utf8"))));
    // lib/lgpd/rules/fontes.ts guarda URLs das fontes oficiais como TEXTO para citação; nunca são requisitadas.
    expect(achados.filter((f) => !f.replace(/\\/g, "/").endsWith("lib/lgpd/rules/fontes.ts"))).toEqual([]);
  });
});

describe("segurança: determinismo do motor (sem relógio nem aleatoriedade)", () => {
  const motor = ["lib/sql", "lib/lgpd"].flatMap(arquivos);
  for (const [re, nome] of [
    [/\bMath\.random\b/, "Math.random"],
    [/\bDate\.now\b/, "Date.now"],
    [/\bnew\s+Date\s*\(/, "new Date()"],
    [/\bperformance\.now\b/, "performance.now"],
    [/\bcrypto\.(?:randomUUID|getRandomValues)\b/, "crypto aleatório"],
  ] as Array<[RegExp, string]>) {
    it(`o motor não usa ${nome}`, () => {
      expect(motor.filter((f) => re.test(semComentarios(readFileSync(f, "utf8"))))).toEqual([]);
    });
  }
});

describe("segurança: em execução, processar um schema não faz nenhuma requisição", () => {
  it("fetch, XHR, beacon, WebSocket e EventSource interceptados: zero chamadas", () => {
    const g = globalThis as Record<string, unknown>;
    const espiao = vi.fn(() => {
      throw new Error("requisição de rede proibida");
    });
    const salvos: Record<string, unknown> = {};
    const alvos = ["fetch", "XMLHttpRequest", "WebSocket", "EventSource"];
    for (const a of alvos) {
      salvos[a] = g[a];
      g[a] = espiao;
    }
    const nav = (g.navigator ?? {}) as Record<string, unknown>;
    const beaconAntes = nav.sendBeacon;
    try {
      Object.defineProperty(g, "navigator", { value: { ...nav, sendBeacon: espiao }, configurable: true });
    } catch {
      /* navigator é só leitura neste ambiente: o espião acima já cobre o resto */
    }

    try {
      const schema = "CREATE TABLE clientes_SEGREDO_XYZ (cpf CHAR(11), email VARCHAR(80), diagnostico TEXT, observacao TEXT);";
      const { analise } = analisarDdl(schema);
      const relatorio = gerarRelatorio(analise, { geradoEm: null });
      const json = paraJson(relatorio);
      paraCsv(relatorio);
      paraMarkdown(relatorio);
      expect(deJson(json).ok).toBe(true);
    } finally {
      for (const a of alvos) g[a] = salvos[a];
      try {
        Object.defineProperty(g, "navigator", { value: { ...nav, sendBeacon: beaconAntes }, configurable: true });
      } catch {
        /* ignorar */
      }
    }
    expect(espiao).not.toHaveBeenCalled();
  });
});
