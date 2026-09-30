import { RELATORIO_VERSAO, resumir, type LinhaRelatorio, type Relatorio } from "./report";
import type { Achado, Confianca, Gravidade, Pessoal } from "./types";

/**
 * Exportação do relatório em JSON, CSV e Markdown. Compartilhar o resultado é por arquivo:
 * o schema nunca vai para URL nem para servidor. Funções puras.
 */

// ---------- JSON (com importação) ----------

export function paraJson(r: Relatorio): string {
  return JSON.stringify(r, null, 2);
}

export type ResultadoImportacao = { ok: true; relatorio: Relatorio } | { ok: false; erro: string };

const PESSOAL: readonly string[] = ["sim", "nao", "depende"];
const CONFIANCA: readonly string[] = ["alta", "media", "baixa"];
const GRAVIDADE: readonly string[] = ["alta", "media", "baixa"];

function ehObjeto(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}
const str = (x: unknown): x is string => typeof x === "string";

function linhaValida(x: unknown): x is LinhaRelatorio {
  if (!ehObjeto(x)) return false;
  return (
    str(x.tabela) && str(x.coluna) && str(x.tipoSql) && str(x.categoria) &&
    (x.subtipo === null || str(x.subtipo)) &&
    typeof x.sensivel === "boolean" && str(x.pessoal) && PESSOAL.includes(x.pessoal) &&
    typeof x.altoRisco === "boolean" && str(x.confianca) && CONFIANCA.includes(x.confianca) &&
    str(x.motivo) && (x.origem === "regra" || x.origem === "manual") &&
    str(x.finalidade) && str(x.baseLegal) && str(x.retencao) &&
    Array.isArray(x.protecao) && x.protecao.every(str) && (x.nota === null || str(x.nota))
  );
}

function achadoValido(x: unknown): x is Achado {
  if (!ehObjeto(x)) return false;
  return (
    str(x.id) && str(x.gravidade) && GRAVIDADE.includes(x.gravidade) && str(x.tabela) &&
    (x.coluna === null || str(x.coluna)) && str(x.titulo) && str(x.explicacao) &&
    Array.isArray(x.fontes) && x.fontes.every(str)
  );
}

/** Lê um relatório exportado em JSON. Nunca lança: devolve o motivo do erro. */
export function deJson(texto: string): ResultadoImportacao {
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return { ok: false, erro: "O arquivo não é um JSON válido." };
  }
  if (!ehObjeto(bruto)) return { ok: false, erro: "O JSON não tem o formato de um relatório da Tarja." };
  if (bruto.versao !== RELATORIO_VERSAO) {
    return { ok: false, erro: `Versão de relatório não suportada: ${String(bruto.versao)}.` };
  }
  if (!str(bruto.regras) || !str(bruto.aviso) || !(bruto.geradoEm === null || str(bruto.geradoEm))) {
    return { ok: false, erro: "Faltam campos do cabeçalho do relatório." };
  }
  if (!Array.isArray(bruto.linhas) || !bruto.linhas.every(linhaValida)) {
    return { ok: false, erro: "Alguma linha do relatório está fora do formato." };
  }
  if (!Array.isArray(bruto.achados) || !bruto.achados.every(achadoValido)) {
    return { ok: false, erro: "Algum achado do relatório está fora do formato." };
  }
  return {
    ok: true,
    relatorio: {
      versao: bruto.versao,
      regras: bruto.regras,
      aviso: bruto.aviso,
      geradoEm: bruto.geradoEm,
      linhas: bruto.linhas as LinhaRelatorio[],
      achados: bruto.achados as Achado[],
    },
  };
}

// ---------- CSV ----------

const CABECALHO_CSV = [
  "tabela", "coluna", "tipo_sql", "categoria", "subtipo", "sensivel", "dado_pessoal", "alto_risco", "confianca",
  "motivo", "origem", "finalidade", "base_legal_hipotese", "retencao", "protecao_sugerida", "nota",
] as const;

/**
 * Uma célula de CSV. Planilhas tratam células que começam com = + - @ (ou tab e CR) como fórmula.
 * Nomes de coluna vêm do usuário, então esses valores ganham um apóstrofo na frente.
 */
export function celulaCsv(valor: string): string {
  let v = valor;
  if (v.length > 0 && "=+-@\t\r".includes(v[0] as string)) v = `'${v}`;
  if (/[",\r\n]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}

const simNao = (b: boolean) => (b ? "sim" : "nao");

export function paraCsv(r: Relatorio): string {
  const linhas: string[] = [CABECALHO_CSV.join(",")];
  for (const l of r.linhas) {
    const celulas = [
      l.tabela, l.coluna, l.tipoSql, l.categoria, l.subtipo ?? "", simNao(l.sensivel), l.pessoal, simNao(l.altoRisco),
      l.confianca, l.motivo, l.origem, l.finalidade, l.baseLegal, l.retencao, l.protecao.join(" | "), l.nota ?? "",
    ];
    linhas.push(celulas.map(celulaCsv).join(","));
  }
  return linhas.join("\r\n") + "\r\n";
}

// ---------- Markdown ----------

/** Escapa texto do usuário para uso dentro de uma célula de tabela Markdown. */
export function escMd(valor: string): string {
  let out = "";
  for (const ch of valor) {
    switch (ch) {
      case "&": out += "&amp;"; break;
      case "<": out += "&lt;"; break;
      case ">": out += "&gt;"; break;
      case "|": out += "\\|"; break;
      case "\\": out += "\\\\"; break;
      case "`": out += "\\`"; break;
      case "*": out += "\\*"; break;
      case "_": out += "\\_"; break;
      case "[": out += "\\["; break;
      case "]": out += "\\]"; break;
      case "\r":
      case "\n": out += " "; break;
      default: out += ch;
    }
  }
  return out;
}

const ROTULO_PESSOAL: Record<Pessoal, string> = { sim: "sim", nao: "não", depende: "depende" };
const ROTULO_CONFIANCA: Record<Confianca, string> = { alta: "alta", media: "média", baixa: "baixa" };
const ROTULO_GRAVIDADE: Record<Gravidade, string> = { alta: "alta", media: "média", baixa: "baixa" };

export function paraMarkdown(r: Relatorio): string {
  const s = resumir(r);
  const out: string[] = [];
  out.push("# Mapeamento de dados pessoais (rascunho)", "");
  out.push(`> ${escMd(r.aviso)}`, "");
  out.push(`Regras: \`${r.regras}\`${r.geradoEm ? ` · gerado em ${escMd(r.geradoEm)}` : ""}`, "");
  out.push(
    `**Resumo:** ${s.tabelas} tabelas, ${s.colunas} colunas, ${s.pessoais} com dado pessoal, ${s.dependem} que dependem, ` +
      `${s.sensiveis} sensíveis, ${s.altoRisco} financeiras (alto risco), ${s.corrigidasAMao} corrigidas à mão, ${s.achados} achados.`,
    "",
  );
  out.push("## Colunas", "");
  out.push(
    "| Tabela | Coluna | Categoria | Sensível? | Pessoal? | Confiança | Finalidade (a preencher) | Base legal (hipótese) | Retenção | Proteção sugerida |",
    "|---|---|---|---|---|---|---|---|---|---|",
  );
  for (const l of r.linhas) {
    const categoria = l.subtipo ? `${l.categoria} (${l.subtipo})` : l.categoria;
    out.push(
      `| ${escMd(l.tabela)} | ${escMd(l.coluna)} | ${escMd(categoria)} | ${l.sensivel ? "sim" : "não"} | ${ROTULO_PESSOAL[l.pessoal]} | ` +
        `${ROTULO_CONFIANCA[l.confianca]}${l.origem === "manual" ? " (manual)" : ""} | ${escMd(l.finalidade) || "_a preencher_"} | ` +
        `${escMd(l.baseLegal)} | ${escMd(l.retencao)} | ${escMd(l.protecao.join("; "))} |`,
    );
  }
  out.push("", "## Achados do schema", "");
  if (r.achados.length === 0) out.push("Nenhum achado.");
  for (const a of r.achados) {
    const alvo = a.coluna ? `${a.tabela}.${a.coluna}` : a.tabela;
    out.push(`- **${escMd(a.titulo)}** (${ROTULO_GRAVIDADE[a.gravidade]}) em \`${alvo.replace(/`/g, "'")}\`: ${escMd(a.explicacao)}`);
  }
  out.push("");
  return out.join("\n");
}
