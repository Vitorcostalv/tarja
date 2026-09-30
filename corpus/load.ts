import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Categorias do gabarito (corpus/GABARITO.md). */
export const GOLD_CODES = {
  idd: "identificador_direto",
  loc: "localizacao",
  fin: "financeiro",
  cri: "crianca_adolescente",
  sen: "sensivel",
  out: "outro_dado_pessoal",
  nid: "nao_identificado",
} as const;

export type GoldCategory = (typeof GOLD_CODES)[keyof typeof GOLD_CODES];

export interface GoldColumn {
  key: string; // "tabela.coluna"
  table: string;
  column: string;
  category: GoldCategory;
  subtype: string | null;
  /** true quando o gabarito diz "depende" (sufixo ?). Fica fora da métrica binária. */
  depends: boolean;
}

export interface GoldFinding {
  id: string;
  /** "tabela" ou "tabela.coluna" */
  target: string;
}

export interface Gold {
  columns: GoldColumn[];
  findings: GoldFinding[];
}

export interface CorpusSchema {
  name: string;
  sql: string;
  gold: Gold;
}

export function parseGold(text: string, source = "gabarito"): Gold {
  const columns: GoldColumn[] = [];
  const findings: GoldFinding[] = [];
  const seen = new Set<string>();
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) return;
    const where = `${source}:${i + 1}`;
    const parts = line.split(/\s+/);
    if (parts[0] === "@achado") {
      if (parts.length !== 3) throw new Error(`${where}: @achado precisa de ID e alvo`);
      findings.push({ id: parts[1] as string, target: parts[2] as string });
      return;
    }
    const [key, codeRaw, flag] = parts;
    if (!key || !codeRaw || parts.length > 3 || (flag !== undefined && flag !== "?")) {
      throw new Error(`${where}: linha inválida "${line}"`);
    }
    const [code, subtype] = codeRaw.split(":");
    const category = GOLD_CODES[code as keyof typeof GOLD_CODES];
    if (!category) throw new Error(`${where}: categoria desconhecida "${code}"`);
    if ((code === "sen") !== (subtype !== undefined)) {
      throw new Error(`${where}: só "sen" leva subtipo (sen:saude) e "sen" sempre leva`);
    }
    const dot = key.indexOf(".");
    if (dot < 1) throw new Error(`${where}: esperado tabela.coluna`);
    if (seen.has(key)) throw new Error(`${where}: coluna repetida ${key}`);
    seen.add(key);
    columns.push({
      key,
      table: key.slice(0, dot),
      column: key.slice(dot + 1),
      category,
      subtype: subtype ?? null,
      depends: flag === "?",
    });
  });
  return { columns, findings };
}

/**
 * Carrega os pares NOME.gold.txt + NOME.sql de uma pasta do corpus.
 * Schemas de licença copyleft não ficam no repositório: o SQL vem de `.fetched/NOME.sql`,
 * baixado por `npm run corpus:fetch`.
 */
export function loadCorpus(dir: string): CorpusSchema[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".gold.txt"))
    .sort()
    .map((f) => {
      const name = f.replace(/\.gold\.txt$/, "");
      const local = join(dir, `${name}.sql`);
      const baixado = join(dir, ".fetched", `${name}.sql`);
      const arquivo = existsSync(local) ? local : baixado;
      if (!existsSync(arquivo)) {
        throw new Error(`Falta o SQL de "${name}" em ${dir}. Rode "npm run corpus:fetch" para baixar os schemas de licença copyleft.`);
      }
      const goldFile = join(dir, f);
      return { name, sql: readFileSync(arquivo, "utf8"), gold: parseGold(readFileSync(goldFile, "utf8"), goldFile) };
    });
}
