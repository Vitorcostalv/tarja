import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Baixa os schemas públicos com licença copyleft (GPL) em vez de guardá-los no repositório.
 * Os arquivos vão para corpus/<corpus>/.fetched/ (ignorado pelo git). Cada URL aponta para um
 * commit fixo, e o hash do arquivo baixado fica em corpus/fetch-lock.json: se o upstream mudar,
 * a verificação falha em vez de trocar o corpus sem aviso.
 *
 * Uso: npm run corpus:fetch            (baixa o que faltar e confere o hash)
 *      npm run corpus:fetch -- --lock  (grava os hashes; só na primeira vez ou em troca deliberada)
 */

interface Item {
  nome: string;
  destino: string;
  url: string;
  licenca: string;
  fonte: string;
  extrair: (bruto: string) => string;
}

const OPENEMR_COMMIT = "08b1f2a247d346cc5772f368fd87164b80dfaaf5";
const WORDPRESS_COMMIT = "24b87326be3ba04e0163c879ae558fe34d0ab6a0";

/** Extrai só as instruções CREATE TABLE das tabelas pedidas. */
function tabelasMysql(bruto: string, nomes: string[]): string {
  const blocos: string[] = [];
  for (const nome of nomes) {
    const ini = bruto.search(new RegExp("CREATE TABLE `?" + nome + "`? \\("));
    if (ini === -1) throw new Error(`tabela ${nome} não encontrada`);
    const fim = bruto.indexOf(";\n", ini);
    blocos.push(bruto.slice(ini, fim + 1));
  }
  return blocos.join("\n\n") + "\n";
}

function tabelasWordPress(bruto: string): string {
  const out: string[] = [];
  const usuarios = /CREATE TABLE \$wpdb->users \(([\s\S]*?)\n\) \$charset_collate;/.exec(bruto);
  if (!usuarios) throw new Error("tabela users do WordPress não encontrada");
  out.push(`CREATE TABLE wp_users (${usuarios[1]}\n);`);
  for (const nome of ["usermeta", "comments", "signups"]) {
    const m = new RegExp("CREATE TABLE \\$wpdb->" + nome + " \\(([\\s\\S]*?)\\n\\) \\$charset_collate;").exec(bruto);
    if (!m) throw new Error(`tabela ${nome} do WordPress não encontrada`);
    out.push(`CREATE TABLE wp_${nome} (${m[1]}\n);`);
  }
  return out.join("\n\n").replace(/\$max_index_length/g, "191") + "\n";
}

const CABECALHO = (i: Item) =>
  `-- Corpus externo baixado por scripts/fetch-external.ts. NÃO está no repositório.\n` +
  `-- Fonte: ${i.fonte}\n-- Licença: ${i.licenca}. Só as instruções CREATE TABLE das tabelas usadas.\n\n`;

export const ITENS: Item[] = [
  {
    nome: "wordpress",
    destino: "corpus/external/.fetched/wordpress.sql",
    url: `https://raw.githubusercontent.com/WordPress/WordPress/${WORDPRESS_COMMIT}/wp-admin/includes/schema.php`,
    licenca: "GPL v2 ou posterior",
    fonte: `WordPress, wp-admin/includes/schema.php no commit ${WORDPRESS_COMMIT}`,
    extrair: tabelasWordPress,
  },
  {
    nome: "openemr",
    destino: "corpus/external-v2/.fetched/openemr.sql",
    url: `https://raw.githubusercontent.com/openemr/openemr/${OPENEMR_COMMIT}/sql/database.sql`,
    licenca: "GPL v3",
    fonte: `OpenEMR, sql/database.sql no commit ${OPENEMR_COMMIT}`,
    extrair: (b) => tabelasMysql(b, ["patient_data", "insurance_data", "users", "employer_data", "prescriptions", "immunizations"]),
  },
];

const LOCK = "corpus/fetch-lock.json";
const sha = (t: string) => createHash("sha256").update(t).digest("hex");

async function main(): Promise<void> {
  const gravarLock = process.argv.includes("--lock");
  const lock: Record<string, string> = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")) : {};
  for (const item of ITENS) {
    const resposta = await fetch(item.url);
    if (!resposta.ok) throw new Error(`${item.nome}: HTTP ${resposta.status} em ${item.url}`);
    const bruto = (await resposta.text()).replace(/\r\n/g, "\n");
    const hash = sha(bruto);
    if (gravarLock) lock[item.nome] = hash;
    else if (lock[item.nome] !== hash) {
      throw new Error(`${item.nome}: o arquivo baixado mudou (hash ${hash} != ${lock[item.nome] ?? "sem lock"}). Rode com --lock só se a troca for deliberada.`);
    }
    mkdirSync(dirname(item.destino), { recursive: true });
    writeFileSync(item.destino, CABECALHO(item) + item.extrair(bruto), "utf8");
    console.log(`${item.nome}: ok (${item.destino})`);
  }
  if (gravarLock) writeFileSync(LOCK, JSON.stringify(lock, null, 2) + "\n", "utf8");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
