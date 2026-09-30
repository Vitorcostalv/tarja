import { escMd } from "../lgpd/export";
import { CATALOGO, regraPorId } from "./catalogo";
import type { ResultadoPadroes, Violacao } from "./verificar";

/**
 * Exportação do resultado dos Padrões de DDL (v2) em Markdown e JSON. Funções puras.
 * O texto do DDL colado nunca entra no arquivo: só os achados e os nomes dos objetos.
 */

export const VERSAO_PADROES = "v2";

const SEV = { erro: "ERRO", aviso: "AVISO" } as const;

export function resumoDoResultado(r: ResultadoPadroes): { erros: number; avisos: number; tabelas: number; rotinas: number; semProblema: number } {
  return {
    erros: r.violacoes.filter((v) => v.severidade === "erro").length,
    avisos: r.violacoes.filter((v) => v.severidade === "aviso").length,
    tabelas: r.tabelas.length,
    rotinas: r.rotinas.length,
    semProblema: r.regrasSemViolacao.length,
  };
}

export function agruparPorObjeto(violacoes: readonly Violacao[]): Array<{ objeto: string; violacoes: Violacao[] }> {
  const mapa = new Map<string, Violacao[]>();
  for (const v of violacoes) {
    const lista = mapa.get(v.objeto) ?? [];
    lista.push(v);
    mapa.set(v.objeto, lista);
  }
  return [...mapa.entries()].map(([objeto, lista]) => ({ objeto, violacoes: lista }));
}

export function paraJsonPadroes(r: ResultadoPadroes): string {
  return JSON.stringify(
    {
      versao: VERSAO_PADROES,
      aviso: "Convenções de DDL definidas pelo autor do projeto. Não são a LGPD nem lei.",
      tabelas: r.tabelas,
      rotinas: r.rotinas,
      violacoes: r.violacoes,
      regrasVerificadasSemProblema: r.regrasSemViolacao,
    },
    null,
    2,
  );
}

export function paraMarkdownPadroes(r: ResultadoPadroes): string {
  const s = resumoDoResultado(r);
  const out: string[] = [];
  out.push(`# Padrões de DDL (${VERSAO_PADROES}): resultado`, "");
  out.push("> Convenções de DDL definidas pelo autor do projeto (MySQL). Não são a LGPD nem lei: valem para quem adota o padrão.", "");
  out.push(`**Resumo:** ${s.tabelas} tabelas, ${s.rotinas} rotinas, ${s.erros} erros, ${s.avisos} avisos, ${s.semProblema} regras verificadas sem problema.`, "");
  if (r.tabelas.length > 0) {
    out.push("## Modo assumido por tabela", "");
    out.push("| Tabela | Perfil | Modo |", "|---|---|---|");
    for (const t of r.tabelas) {
      out.push(`| ${escMd(t.schema ? `${t.schema}.${t.nome}` : t.nome)} | ${t.perfil} | ${t.modo}${t.modoDeduzido ? " (deduzido do charset)" : ""} |`);
    }
    out.push("");
  }
  out.push("## Achados", "");
  if (r.violacoes.length === 0) out.push("Nenhum achado.", "");
  for (const g of agruparPorObjeto(r.violacoes)) {
    out.push(`### ${escMd(g.objeto)}`, "");
    for (const v of g.violacoes) {
      const regra = regraPorId(v.regra);
      out.push(`- **${SEV[v.severidade]}** ${v.regra} (${escMd(regra?.titulo ?? "")})${v.linha ? `, linha ${v.linha}` : ""}: ${escMd(v.detalhe)}`);
    }
    out.push("");
  }
  out.push("## Regras verificadas sem problema", "");
  out.push(r.regrasSemViolacao.length ? r.regrasSemViolacao.map((id) => `${id} (${escMd(regraPorId(id)?.titulo ?? "")})`).join("; ") : "Nenhuma.", "");
  void CATALOGO;
  return out.join("\n");
}
