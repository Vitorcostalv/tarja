import { parseDdl } from "../sql/parser";
import { alvosDeAtribuicao, lerRotinas, referenciasDoComando, type Comando, type Rotina } from "../sql/rotinas";
import type { ParseResult, ParsedColumn, ParsedIndex, ParsedTable } from "../sql/types";
import { CATALOGO, regraPorId, severidadeDa, type Modo, type Severidade } from "./catalogo";

/**
 * Verificador dos "Padrões de DDL v2". Puro e determinístico: mesma entrada, mesma saída.
 * Cada função de regra devolve violações; o catálogo (catalogo.ts) diz o que cada id significa.
 */

export type ModoPedido = "auto" | Modo;
export type Perfil = "tb" | "tr" | "hist" | "arc" | "extensao" | "desconhecido";

export interface OpcoesPadroes {
  modo: ModoPedido;
  /** Tabelas de extensão, separadas por vírgula ou linha. Formato: "tb_site_gf" ou "tb_site_gf:tb_site" (extensão:raiz). */
  extensoes: string;
}

export const OPCOES_PADRAO: OpcoesPadroes = { modo: "auto", extensoes: "" };

export interface Violacao {
  regra: string;
  severidade: Severidade;
  /** schema.tabela, schema.rotina ou "script". */
  objeto: string;
  tipoObjeto: "tabela" | "rotina" | "comando" | "script";
  detalhe: string;
  linha: number | null;
}

export interface InfoTabela {
  nome: string;
  schema: string | null;
  perfil: Perfil;
  modo: Modo;
  /** true quando o modo foi deduzido do charset (latin1 = legada, utf8mb4 = nova). */
  modoDeduzido: boolean;
}

export interface InfoRotina {
  nome: string;
  schema: string | null;
  tipo: string;
  modo: Modo;
}

export interface ResultadoPadroes {
  tabelas: InfoTabela[];
  rotinas: InfoRotina[];
  violacoes: Violacao[];
  /** Ids de regra que foram exercidas em pelo menos um objeto. */
  regrasVerificadas: string[];
  /** Ids exercidos sem nenhuma violação. */
  regrasSemViolacao: string[];
  /** O que o leitor não entendeu ou ignorou (a tela mostra, como na análise de LGPD). */
  leitura: { errors: ParseResult["errors"]; ignored: ParseResult["ignored"]; limitNotices: string[] };
  rejeitado: boolean;
}

// ---------- utilidades ----------

const INT_TIPOS = new Set(["tinyint", "smallint", "mediumint", "int", "integer", "bigint"]);
const DEC_TIPOS = new Set(["decimal", "numeric", "dec", "fixed"]);
const FLOAT_TIPOS = new Set(["float", "double", "double precision", "real"]);
const TEXTO_TIPOS = new Set(["char", "varchar", "tinytext", "text", "mediumtext", "longtext"]);

const ehInt = (c: ParsedColumn) => INT_TIPOS.has(c.baseType);
const ehNumerico = (c: ParsedColumn) => ehInt(c) || DEC_TIPOS.has(c.baseType) || FLOAT_TIPOS.has(c.baseType);
const ehTexto = (c: ParsedColumn) => TEXTO_TIPOS.has(c.baseType);
const semAspas = (s: string | null) => (s === null ? null : s.replace(/^['"]|['"]$/g, ""));
const args = (c: ParsedColumn) => (c.typeArgs ?? "").replace(/\s+/g, "");
const nomeSemTb = (n: string) => n.replace(/^(tb|tr)_/, "");
const minusculo = (s: string) => s.toLowerCase();

/** int(11) signed; o "int" sem largura (MySQL 8) também conta. */
function ehInt11(c: ParsedColumn): boolean {
  return c.baseType === "int" && !c.unsigned && (c.typeArgs === null || args(c) === "11");
}

function rotuloTabela(t: ParsedTable): string {
  return t.schema ? `${t.schema}.${t.name}` : t.name;
}

function perfilDe(nome: string, extensoes: ReadonlySet<string>): Perfil {
  const n = minusculo(nome);
  if (extensoes.has(n)) return "extensao";
  if (n.startsWith("tr_")) return "tr";
  if (n.endsWith("_hist") && n.startsWith("tb_")) return "hist";
  if (n.endsWith("_arc") && n.startsWith("tb_")) return "arc";
  if (n.startsWith("tb_")) return "tb";
  return "desconhecido";
}

function lerExtensoes(texto: string): { nomes: Set<string>; raiz: Map<string, string> } {
  const nomes = new Set<string>();
  const raiz = new Map<string, string>();
  for (const parte of texto.split(/[,\n;]/)) {
    const [ext, r] = parte.trim().split(":").map((x) => minusculo(x.trim()));
    if (!ext) continue;
    nomes.add(ext);
    if (r) raiz.set(ext, r);
  }
  return { nomes, raiz };
}

function modoDaTabela(t: ParsedTable, pedido: ModoPedido): { modo: Modo; deduzido: boolean } {
  if (pedido !== "auto") return { modo: pedido, deduzido: false };
  const cs = t.options.charset;
  if (cs === "latin1") return { modo: "legada", deduzido: true };
  return { modo: "nova", deduzido: true };
}

// ---------- coletor ----------

class Coletor {
  readonly violacoes: Violacao[] = [];
  readonly exercidas = new Set<string>();

  exerce(id: string): void {
    this.exercidas.add(id);
  }

  add(id: string, modo: Modo, objeto: string, tipoObjeto: Violacao["tipoObjeto"], detalhe: string, linha: number | null, forcar?: Severidade): void {
    const regra = regraPorId(id);
    if (!regra) throw new Error(`regra desconhecida: ${id}`);
    this.exercidas.add(id);
    this.violacoes.push({ regra: id, severidade: forcar ?? severidadeDa(regra, modo), objeto, tipoObjeto, detalhe, linha });
  }
}

// ---------- regras de tabela ----------

function colunaPorNome(t: ParsedTable, nome: string): ParsedColumn | undefined {
  return t.columns.find((c) => minusculo(c.name) === nome);
}

// No schema dd os identificadores são em inglês: a coluna de tenant pode ser cod_project e a de alteração, ts_<lema em inglês>.
const ehDd = (t: ParsedTable): boolean => (t.schema ?? "").toLowerCase() === "dd";
const ehProjeto = (t: ParsedTable, n: string): boolean => n === "cod_projeto" || (ehDd(t) && n === "cod_project");
const colunaProjeto = (t: ParsedTable): ParsedColumn | undefined => t.columns.find((c) => ehProjeto(t, minusculo(c.name)));
const LEMAS_ALTERACAO_EN = ["ts_update", "ts_updated", "ts_modification", "ts_modified", "ts_change", "ts_changed"];
const colunaAlteracao = (t: ParsedTable): ParsedColumn | undefined =>
  t.columns.find((c) => {
    const n = minusculo(c.name);
    return n === "ts_alteracao" || (ehDd(t) && LEMAS_ALTERACAO_EN.includes(n));
  });

function notNull(c: ParsedColumn): boolean {
  return !c.nullable || c.isPrimaryKey;
}

function ehCurrentTimestamp(raw: string | null): boolean {
  return raw !== null && /^current_timestamp(\(\d*\))?$/i.test(raw.trim()) || (raw !== null && /^now\(\)$/i.test(raw.trim()));
}

function temTimestampDeAlteracaoCompleto(c: ParsedColumn): boolean {
  return c.baseType === "timestamp" && notNull(c) && ehCurrentTimestamp(c.defaultRaw) && ehCurrentTimestamp(c.onUpdateRaw);
}

const PORTUGUES = new Set([
  "nome", "descricao", "criacao", "alteracao", "usuario", "projeto", "cliente", "valor", "data", "codigo", "ativo", "status",
  "situacao", "empresa", "pessoa", "endereco", "telefone", "documento", "tipo", "categoria", "produto", "pedido", "conta", "lancamento",
  "empresa", "filial", "contrato", "fornecedor", "unidade", "quantidade", "preco", "desconto", "observacao", "motivo", "grupo",
]);

function regraGeral(t: ParsedTable, perfil: Perfil, modo: Modo, c: Coletor, raizes: Map<string, string>, porNome: Map<string, ParsedTable>): void {
  const obj = rotuloTabela(t);
  const add = (id: string, detalhe: string, linha: number | null = t.line, forcar?: Severidade) => c.add(id, modo, obj, "tabela", detalhe, linha, forcar);
  const cols = t.columns;
  const espelha = perfil === "hist" || perfil === "arc";

  // E01
  c.exerce("E01");
  if (perfil === "desconhecido") add("E01", `O nome "${t.name}" não começa com tb_ (nem é tr_). Renomeie para tb_${t.name.replace(/^tb_?/i, "")}.`);
  if (/^tb_hist_/i.test(t.name)) add("L01", `O nome "${t.name}" usa o padrão legado tb_hist_<nome>. O alvo é tb_<nome>_hist.`, t.line);

  // E02
  c.exerce("E02");
  if (!espelha) {
    for (const col of cols) {
      if (!notNull(col)) c.add("E02", modo, obj, "tabela", `A coluna ${col.name} admite NULL. Use NOT NULL com valor-sentinela.`, col.line);
    }
  }
  // E03
  c.exerce("E03");
  if ((t.options.engine ?? "").toLowerCase() !== "innodb") {
    add("E03", t.options.engine ? `ENGINE=${t.options.engine}: use InnoDB.` : "Sem ENGINE=InnoDB declarado.");
  }
  // E05
  c.exerce("E05");
  if (t.options.autoIncrement !== null) add("E05", `AUTO_INCREMENT=${t.options.autoIncrement} na definição da tabela. Remova.`);
  // E06
  c.exerce("E06");
  for (const fk of t.foreignKeys) add("E06", `FOREIGN KEY física em (${fk.columns.join(", ")}) → ${fk.refTable}. A integridade é lógica, por cod_.`);

  // C01 / C02
  c.exerce("C01");
  c.exerce("C02");
  if (t.options.charset && t.options.charset !== "latin1") add("C01", `Charset da tabela é ${t.options.charset}. O alvo é latin1.`);
  if (t.options.collate) add("C02", `COLLATE ${t.options.collate} explícito na tabela. Deixe herdar do charset.`);
  for (const col of cols) {
    if (col.name.toLowerCase().startsWith("js_")) continue; // JSON: utf8mb4 é imposição do tipo
    if (col.charset && col.charset !== "latin1") c.add("C01", modo, obj, "tabela", `A coluna ${col.name} usa charset ${col.charset}. O alvo é latin1.`, col.line);
    if (col.collate) c.add("C02", modo, obj, "tabela", `A coluna ${col.name} declara COLLATE ${col.collate}. Deixe herdar do charset.`, col.line);
  }

  // P01 / P02 / P03
  c.exerce("P01");
  c.exerce("P02");
  c.exerce("P03");
  for (const col of cols) {
    const n = minusculo(col.name);
    const p = (id: string, d: string) => c.add(id, modo, obj, "tabela", d, col.line);
    const tipo = col.rawType;
    const prefixo =
      n.startsWith("nu_secs_") ? "nu_secs_" :
      n.startsWith("nu_milis_") ? "nu_milis_" :
      ["cod_", "nu_", "vl_", "pc_", "qt_", "cnpj_", "cpf_", "en_", "nm_", "tx_", "js_", "dt_", "dh_", "ts_", "hr_"].find((x) => n.startsWith(x)) ?? null;
    if (prefixo === "cod_" && !(ehInt11(col) || (col.baseType === "int" && col.unsigned) || args(col) === "10")) p("P01", `${col.name} é ${tipo}: o prefixo cod_ pede int(11).`);
    if ((prefixo === "nu_" || prefixo === "nu_secs_" || prefixo === "nu_milis_") && !ehNumerico(col)) p("P01", `${col.name} é ${tipo}: o prefixo ${prefixo} pede tipo numérico.`);
    if (prefixo === "vl_" && !(DEC_TIPOS.has(col.baseType) && args(col) === "12,2")) p("P01", `${col.name} é ${tipo}: o prefixo vl_ pede decimal(12,2).`);
    if (prefixo === "pc_" && !(DEC_TIPOS.has(col.baseType) || FLOAT_TIPOS.has(col.baseType))) p("P01", `${col.name} é ${tipo}: o prefixo pc_ pede float ou decimal.`);
    if (prefixo === "qt_" && !ehNumerico(col)) p("P01", `${col.name} é ${tipo}: o prefixo qt_ pede int ou float.`);
    if ((prefixo === "cnpj_" || prefixo === "cpf_") && !(ehTexto(col) && args(col) === "20")) p("P01", `${col.name} é ${tipo}: o prefixo ${prefixo} pede texto(20).`);
    if (prefixo === "en_" && col.baseType !== "enum") p("P01", `${col.name} é ${tipo}: o prefixo en_ pede enum.`);
    if (prefixo === "nm_" && !(col.baseType === "varchar" && ["100", "150", "200", "250"].includes(args(col)))) p("P01", `${col.name} é ${tipo}: o prefixo nm_ pede varchar(100/150/200/250).`);
    if (prefixo === "tx_" && !ehTexto(col)) p("P01", `${col.name} é ${tipo}: o prefixo tx_ pede tipo texto.`);
    if (prefixo === "js_" && col.baseType !== "json") p("P01", `${col.name} é ${tipo}: o prefixo js_ pede JSON.`);
    if (prefixo === "dt_" && !(col.baseType === "date" || col.baseType === "datetime") && n !== "dt_alteracao") p("P01", `${col.name} é ${tipo}: o prefixo dt_ pede date ou datetime.`);
    if (prefixo === "dh_" && col.baseType !== "datetime") p("P01", `${col.name} é ${tipo}: o prefixo dh_ pede datetime.`);
    if (prefixo === "ts_" && col.baseType !== "timestamp") p("P01", `${col.name} é ${tipo}: o prefixo ts_ pede timestamp.`);
    if (prefixo === "hr_" && col.baseType !== "time") p("P01", `${col.name} é ${tipo}: o prefixo hr_ pede time.`);
    // inversa
    if (col.baseType === "enum" && !n.startsWith("en_") && !n.startsWith("e_") && !n.startsWith("flag_")) p("P02", `${col.name} é enum: o prefixo deve ser en_.`);
    if (col.baseType === "timestamp" && !n.startsWith("ts_") && n !== "dt_alteracao") p("P02", `${col.name} é timestamp: o prefixo deve ser ts_.`);
    if (col.baseType === "time" && !n.startsWith("hr_")) p("P02", `${col.name} é time (hora sem data): o prefixo deve ser hr_.`);
    // controle
    if ((n === "dt_criacao" || n === "dt_creation") && !(col.baseType === "datetime" && ehCurrentTimestamp(col.defaultRaw))) p("P03", `${col.name} deve ser DATETIME com DEFAULT CURRENT_TIMESTAMP (está ${tipo}${col.defaultRaw ? ` DEFAULT ${col.defaultRaw}` : " sem default"}).`);
    if (n === "ts_alteracao" && col.baseType !== "timestamp") p("P03", `ts_alteracao deve ser TIMESTAMP (está ${tipo}).`);
    if (n === "dt_alteracao" && col.baseType === "timestamp") p("P03", "dt_alteracao do tipo timestamp é legado: o correto é ts_alteracao.");
  }

  // D
  for (const id of ["D01", "D02", "D03", "D04", "D05"]) c.exerce(id);
  for (const col of cols) {
    const n = minusculo(col.name);
    const d = (id: string, detalhe: string, forcar?: Severidade) => c.add(id, modo, obj, "tabela", detalhe, col.line, forcar);
    if (ehProjeto(t, n) && col.hasDefault) d("D05", `${col.name} tem DEFAULT ${col.defaultRaw}. Remova: zero nunca é um tenant válido.`);
    if (espelha) continue;
    if (col.baseType === "varchar" && notNull(col) && !col.isPrimaryKey && semAspas(col.defaultRaw) !== "") d("D01", `${col.name} varchar NOT NULL sem DEFAULT ''.`);
    if (n.startsWith("vl_") && !(Number(semAspas(col.defaultRaw)) === 0 && col.defaultRaw !== null)) d("D02", `${col.name} sem DEFAULT '0.00'.`);
    if (col.baseType === "datetime" && notNull(col) && n !== "dt_criacao" && n !== "dt_creation" && n !== "dt_criacao_hist" && n !== "dt_carga" && !col.hasDefault) d("D03", `${col.name} datetime NOT NULL sem DEFAULT '0000-00-00 00:00:00' (sentinela de "sem valor").`);
    if (col.baseType === "time" && notNull(col) && !col.hasDefault) d("D03", `${col.name} time NOT NULL sem DEFAULT '00:00:00'.`);
    if (n.startsWith("cod_") && !ehProjeto(t, n) && !col.isPrimaryKey && !t.primaryKey.includes(col.name) && col.hasDefault && Number(semAspas(col.defaultRaw)) === 0) d("D04", `${col.name} (FK) tem DEFAULT ${col.defaultRaw}: esquecer a coluna no INSERT grava 0 sem ninguém ver.`);
  }

  // I
  for (const id of ["I01", "I02", "I03", "I04"]) c.exerce(id);
  const secundarios = t.indexes;
  const temProjeto = !!colunaProjeto(t);
  const uk1dia = perfil === "tr";
  for (const ix of secundarios) {
    const i = (id: string, d: string) => c.add(id, modo, obj, "tabela", d, ix.line);
    const nomeIx = ix.name ?? "(sem nome)";
    if (!(uk1dia && ix.unique) && ix.kind === "key" && !(ix.name ?? "").toLowerCase().startsWith("i_")) i("I01", `O índice ${nomeIx} (${ix.columns.join(", ")}) não começa com i_.`);
    if (ix.kind !== "key" || uk1dia) continue;
    const cs = ix.columns.map(minusculo);
    if (!ix.unique && cs.length === 1 && temProjeto && !cs[0]!.startsWith("cod_")) i("I03", `O índice ${nomeIx} é só de ${ix.columns[0]}. Prefira (cod_projeto, ${ix.columns[0]}).`);
    if (ix.unique && temProjeto && !cs.some((x) => ehProjeto(t, x))) {
      i("I04", cs.length === 1 ? `UNIQUE em ${ix.columns[0]} sozinho impõe unicidade global entre projetos. Use (cod_projeto, ${ix.columns[0]}).` : `O UNIQUE ${nomeIx} (${ix.columns.join(", ")}) não tem cod_projeto: a unicidade vale entre projetos.`);
    }
  }
  if (secundarios.length > 5) add("I02", `${secundarios.length} índices secundários (o recomendado é no máximo 5). Confira se cada um é usado.`);

  // B e L
  c.exerce("B01");
  c.exerce("B02");
  c.exerce("L01");
  for (const col of cols) {
    const n = minusculo(col.name);
    if (n.startsWith("flag_")) c.add("B01", modo, obj, "tabela", `${col.name} (${col.rawType}): Sim/Não deveria ser enum com prefixo en_.`, col.line);
    if (n.startsWith("en_") && col.baseType === "enum") {
      for (const v of col.enumValues) {
        if (!/^[A-Z][a-z0-9]*([ _][A-Z][a-z0-9]*)*$/.test(v)) c.add("B02", modo, obj, "tabela", `${col.name}: o valor '${v}' não está em Proper Case sem acento.`, col.line);
      }
    }
    const l = (d: string) => c.add("L01", modo, obj, "tabela", d, col.line);
    if (n.startsWith("e_") && col.baseType === "enum") l(`${col.name}: prefixo e_ é legado; use en_ e valores em Proper Case.`);
    if (n.startsWith("cod_") && col.baseType === "int" && (col.unsigned || args(col) === "10")) l(`${col.name} é ${col.rawType}${col.unsigned ? " unsigned" : ""}: o alvo é int(11).`);
    if (n.startsWith("num_")) l(`${col.name}: num_ é legado; use nu_.`);
    if (n.startsWith("valor_")) l(`${col.name}: valor_ é legado; use vl_ decimal(12,2).`);
    if (n === "tx_desc") l("tx_desc é legado; use tx_descricao varchar(255).");
    if (n.startsWith("cod_hist_")) l(`${col.name}: o alvo é cod_<nome>_hist.`);
  }

  // G01
  c.exerce("G01");
  if ((t.schema ?? "").toLowerCase() === "dd") {
    const partes = [...t.name.toLowerCase().split("_"), ...cols.flatMap((x) => x.name.toLowerCase().split("_"))];
    const achadas = [...new Set(partes.filter((p) => PORTUGUES.has(p)))];
    if (achadas.length > 0) add("G01", `Identificadores em português no schema dd: ${achadas.join(", ")}.`);
  }

  // Perfis
  if (perfil === "tb" || perfil === "desconhecido") perfilTb(t, modo, c);
  if (perfil === "tr") perfilTr(t, modo, c);
  if (perfil === "hist" || perfil === "arc") perfilHist(t, perfil, modo, c);
  if (perfil === "extensao") perfilExtensao(t, modo, c, raizes, porNome);
}

function perfilTb(t: ParsedTable, modo: Modo, c: Coletor): void {
  const obj = rotuloTabela(t);
  const cols = t.columns;
  const add = (id: string, d: string, linha: number | null = t.line) => c.add(id, modo, obj, "tabela", d, linha);
  const nome = nomeSemTb(t.name);

  // E07
  c.exerce("E07");
  const primeira = cols[0];
  const esperado = `cod_${nome}`.toLowerCase();
  if (!primeira || minusculo(primeira.name) !== esperado || !(primeira.isPrimaryKey || t.primaryKey.includes(primeira.name)) || !primeira.autoIncrement) {
    add("E07", `A 1ª coluna deve ser a PK ${esperado} int(11) NOT NULL AUTO_INCREMENT (está: ${primeira ? `${primeira.name}${primeira.autoIncrement ? "" : ", sem AUTO_INCREMENT"}` : "nenhuma"}).`, primeira?.line ?? t.line);
  }
  // E08
  c.exerce("E08");
  if (!colunaProjeto(t)) add("E08", "Falta cod_projeto int(11) NOT NULL. Ignore se for tabela de associação N:N ou lookup legada.");
  // E09
  c.exerce("E09");
  const desc = colunaPorNome(t, "tx_descricao") ?? colunaPorNome(t, "tx_description");
  if (desc && !(desc.baseType === "varchar" && args(desc) === "255")) add("E09", `${desc.name} é ${desc.rawType}: use varchar(255).`, desc.line);
  // E10
  c.exerce("E10");
  const cria = colunaPorNome(t, "dt_criacao") ?? colunaPorNome(t, "dt_creation");
  if (!cria) add("E10", "Falta dt_criacao datetime NOT NULL DEFAULT CURRENT_TIMESTAMP.");
  else if (!(cria.baseType === "datetime" && notNull(cria) && ehCurrentTimestamp(cria.defaultRaw))) add("E10", `${cria.name} deve ser datetime NOT NULL DEFAULT CURRENT_TIMESTAMP.`, cria.line);
  // E11
  c.exerce("E11");
  const ts = colunaAlteracao(t);
  if (!ts) add("E11", "Falta ts_alteracao timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP como última coluna.");
  else {
    if (!temTimestampDeAlteracaoCompleto(ts)) add("E11", `ts_alteracao deve ser timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP (está ${ts.rawType}${ts.defaultRaw ? ` DEFAULT ${ts.defaultRaw}` : ""}${ts.onUpdateRaw ? ` ON UPDATE ${ts.onUpdateRaw}` : ""}).`, ts.line);
    if (cols[cols.length - 1] !== ts) add("E11", "ts_alteracao deve ser a última coluna.", ts.line);
  }

  // O01
  c.exerce("O01");
  const rank = (col: ParsedColumn, i: number): number => {
    const n = minusculo(col.name);
    if (i === 0 && n.startsWith("cod_")) return 0;
    if (n === "cod_projeto") return 1;
    if (n.startsWith("cod_")) return 2;
    if (n.startsWith("nm_")) return 3;
    if (n === "tx_descricao" || n === "tx_description") return 4;
    if (n === "dt_criacao" || n === "dt_creation") return 5;
    if (n === "ts_alteracao" || LEMAS_ALTERACAO_EN.includes(n)) return 8;
    if (n.startsWith("flag_") || n.startsWith("en_")) return 7;
    return 6;
  };
  let maior = -1;
  let maiorNome = "";
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i] as ParsedColumn;
    const r = rank(col, i);
    if (r < maior) {
      add("O01", `${col.name} está depois de ${maiorNome}, fora da ordem canônica (cod_pk → cod_projeto → cod_ → nm_ → tx_descricao → dt_criacao → negócio → flag_/en_ → ts_alteracao).`, col.line);
      break;
    }
    if (r > maior) {
      maior = r;
      maiorNome = col.name;
    }
  }
}

function perfilTr(t: ParsedTable, modo: Modo, c: Coletor): void {
  const obj = rotuloTabela(t);
  const add = (d: string, linha: number | null = t.line) => c.add("R01", modo, obj, "tabela", d, linha);
  c.exerce("R01");
  if (t.primaryKey.length > 0 || t.columns.some((x) => x.isPrimaryKey)) add("Perfil tr_ não tem PRIMARY KEY.");
  if (t.columns.some((x) => x.autoIncrement)) add("Perfil tr_ não tem AUTO_INCREMENT.");
  const uk = t.indexes.find((x) => x.unique && (x.name ?? "").toLowerCase() === `uk_${t.name.toLowerCase()}_1dia`);
  if (!uk) add(`Falta UNIQUE KEY uk_${t.name}_1dia (cod_<entidade>, dt_referencia).`);
  else if (!uk.columns.map(minusculo).includes("dt_referencia")) add(`uk_${t.name}_1dia deve incluir dt_referencia.`, uk.line);
  const n = t.columns.length;
  const ref = t.columns[n - 2];
  const carga = t.columns[n - 1];
  if (!ref || minusculo(ref.name) !== "dt_referencia" || ref.baseType !== "date" || !notNull(ref)) add("A penúltima coluna deve ser dt_referencia date NOT NULL.", ref?.line ?? t.line);
  if (!carga || minusculo(carga.name) !== "dt_carga" || carga.baseType !== "datetime" || !notNull(carga) || !ehCurrentTimestamp(carga.defaultRaw)) add("A última coluna deve ser dt_carga datetime NOT NULL DEFAULT CURRENT_TIMESTAMP.", carga?.line ?? t.line);
}

function perfilHist(t: ParsedTable, perfil: "hist" | "arc", modo: Modo, c: Coletor): void {
  const obj = rotuloTabela(t);
  const idCabecalho = perfil === "hist" ? "H02" : "H05";
  const sufixo = perfil === "hist" ? "_hist" : "_arc";
  c.exerce("H01");
  c.exerce("H02");
  if (perfil === "arc") c.exerce("H05");
  if (perfil === "hist") {
    c.exerce("H03");
    c.exerce("H04");
  }
  const add = (id: string, d: string, linha: number | null = t.line) => c.add(id, modo, obj, "tabela", d, linha);

  // H01: nome e schema
  if (t.schema !== null && !t.schema.toLowerCase().endsWith("_hist") && !t.schema.toLowerCase().endsWith("hist")) {
    add("H01", `O schema ${t.schema} não tem o sufixo _hist. O histórico mora no schema da origem + _hist.`);
  }
  const nome = t.name.toLowerCase().slice(3); // sem "tb_"
  const esperadoPk = `cod_${nome}`;
  const cab = t.columns.slice(0, 4);
  const faltas: string[] = [];
  const c0 = cab[0];
  if (!c0 || minusculo(c0.name) !== esperadoPk || !c0.autoIncrement || !(c0.isPrimaryKey || t.primaryKey.includes(c0.name))) faltas.push(`1ª ${esperadoPk} (PK autonumerada)`);
  const c1 = cab[1];
  if (!c1 || minusculo(c1.name) !== "cod_user_create_hist" || !ehInt11(c1) || !notNull(c1)) faltas.push("2ª cod_user_create_hist int(11) NOT NULL");
  const c2 = cab[2];
  if (!c2 || minusculo(c2.name) !== "cod_processo" || !ehInt11(c2) || !notNull(c2)) faltas.push("3ª cod_processo int(11) NOT NULL");
  const c3 = cab[3];
  if (!c3 || minusculo(c3.name) !== "dt_criacao_hist" || c3.baseType !== "datetime" || !notNull(c3) || !ehCurrentTimestamp(c3.defaultRaw)) faltas.push("4ª dt_criacao_hist datetime NOT NULL DEFAULT CURRENT_TIMESTAMP");
  if (faltas.length) add(idCabecalho, `Cabeçalho do ${sufixo.slice(1)} fora do padrão: ${faltas.join("; ")}.`, cab[0]?.line ?? t.line);

  if (perfil === "hist") {
    const ts = colunaAlteracao(t);
    const ultima = t.columns[t.columns.length - 1];
    if (!ts || !temTimestampDeAlteracaoCompleto(ts) || ultima !== ts) add("H03", "O _hist termina com ts_alteracao timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP (trilha de adulteração).", ts?.line ?? t.line);
    const cabecalho = new Set(["cod_user_create_hist", "cod_processo", "dt_criacao_hist", "ts_alteracao", ...LEMAS_ALTERACAO_EN, esperadoPk]);
    for (const col of t.columns) {
      if (cabecalho.has(minusculo(col.name))) continue;
      if (col.hasDefault) add("H04", `${col.name} (coluna de origem) tem DEFAULT ${col.defaultRaw}: a rotina de histórico preenche tudo via SELECT, o default só esconderia uma coluna esquecida.`, col.line);
    }
  }
}

function perfilExtensao(t: ParsedTable, modo: Modo, c: Coletor, raizes: Map<string, string>, porNome: Map<string, ParsedTable>): void {
  const obj = rotuloTabela(t);
  c.exerce("X01");
  c.exerce("E08");
  c.exerce("E11");
  const add = (d: string, linha: number | null = t.line) => c.add("X01", modo, obj, "tabela", d, linha);
  const pk = t.columns.find((x) => x.isPrimaryKey || t.primaryKey.includes(x.name));
  if (!pk) add("Falta a PK herdada da raiz (cod_<raiz> int(11) NOT NULL, sem AUTO_INCREMENT).");
  else if (pk.autoIncrement) add(`A PK ${pk.name} é autonumerada: na extensão a identidade é a da raiz, sem AUTO_INCREMENT.`, pk.line);
  const cria = colunaPorNome(t, "dt_criacao") ?? colunaPorNome(t, "dt_creation");
  if (cria) add(`${cria.name} duplica a data de criação da raiz. A extensão não tem dt_criacao.`, cria.line);
  if (!colunaProjeto(t)) c.add("E08", modo, obj, "tabela", "Falta cod_projeto int(11) NOT NULL (sem DEFAULT).", t.line);
  const ts = colunaAlteracao(t);
  if (!ts || !temTimestampDeAlteracaoCompleto(ts) || t.columns[t.columns.length - 1] !== ts) c.add("E11", modo, obj, "tabela", "A extensão mantém ts_alteracao completo como última coluna.", ts?.line ?? t.line);
  const raizNome = raizes.get(minusculo(t.name));
  const raiz = raizNome ? porNome.get(raizNome) : undefined;
  if (raiz && (raiz.schema ?? "") !== (t.schema ?? "")) add(`A extensão está em ${t.schema ?? "(sem schema)"} e a raiz ${raiz.name} em ${raiz.schema ?? "(sem schema)"}: devem ficar no mesmo schema.`);
}

// ---------- rotinas e comandos ----------

const VERBOS = new Set(["criar", "apagar", "alterar", "ativar", "desativar", "bloquear", "create", "delete", "update", "activate", "deactivate", "block"]);

function escritas(r: Rotina): Array<{ cmd: Comando; schema: string | null; tabela: string }> {
  const out: Array<{ cmd: Comando; schema: string | null; tabela: string }> = [];
  for (const cmd of r.comandos) {
    if (!["INSERT", "UPDATE", "DELETE", "REPLACE"].includes(cmd.tipo)) continue;
    const via = cmd.tipo === "DELETE" ? "from" : cmd.tipo === "UPDATE" ? "update" : "into";
    const alvo = referenciasDoComando(cmd).find((x) => x.via === via);
    if (!alvo) continue;
    if (!/^tb_/i.test(alvo.nome) || /_(hist|arc)$/i.test(alvo.nome)) continue;
    out.push({ cmd, schema: alvo.schema, tabela: alvo.nome.toLowerCase() });
  }
  return out;
}

function chamadas(r: Rotina): Array<{ cmd: Comando; schema: string | null; nome: string }> {
  const out: Array<{ cmd: Comando; schema: string | null; nome: string }> = [];
  for (const cmd of r.comandos) {
    if (cmd.tipo !== "CALL") continue;
    const ref = referenciasDoComando(cmd).find((x) => x.via === "call");
    if (ref) out.push({ cmd, schema: ref.schema, nome: ref.nome.toLowerCase() });
  }
  return out;
}

function verificarRotina(r: Rotina, modo: Modo, versionadas: ReadonlySet<string>, c: Coletor): void {
  const obj = r.schema ? `${r.schema}.${r.nome}` : r.nome;
  const add = (id: string, d: string, linha: number | null = r.linha, forcar?: Severidade) => c.add(id, modo, obj, "rotina", d, linha, forcar);

  // S01 DEFINER
  c.exerce("S01");
  if (!r.definer) add("S01", "Sem DEFINER explícito: a rotina assume o usuário que rodou o CREATE. Declare DEFINER=`root`@`localhost`.", r.linha, "aviso");
  else if (!(minusculo(r.definer.usuario ?? "") === "root" && minusculo(r.definer.host ?? "") === "localhost")) {
    add("S01", `DEFINER ${r.definer.raw} é pessoal ou de host remoto. Use \`root\`@\`localhost\`.`);
  }

  // Q01 (nome da própria rotina)
  c.exerce("Q01");
  if (r.schema === null) add("Q01", `CREATE ${r.tipo.toUpperCase()} ${r.nome} sem schema. Qualifique: schema.${r.nome}.`);

  const nome = r.nome.toLowerCase();
  const ehHistOuArc = /^sp_.+_(hist|arc)$/.test(nome);
  const ehLock = /_lock$/.test(nome);

  // S02
  if (r.tipo === "procedure") {
    c.exerce("S02");
    if (!nome.startsWith("sp_")) add("S02", `O nome ${r.nome} não começa com sp_.`);
    else if (!ehHistOuArc && !ehLock) {
      const verbo = nome.split("_")[1] ?? "";
      if (!VERBOS.has(verbo)) add("S02", `${r.nome} não segue sp_[função]_[tabela] (função esperada: criar, apagar, alterar, ativar, desativar, bloquear). Se for um worker, ignore.`);
    }
  }

  // S07
  c.exerce("S07");
  if (r.tipo === "procedure" && ehHistOuArc && r.schema !== null && !r.schema.toLowerCase().endsWith("hist")) add("S07", `${r.nome} está no schema ${r.schema}. Rotinas de histórico e archive moram no schema _hist.`);

  // Escritas e histórico
  const esc = escritas(r);
  const cham = chamadas(r);
  const temLastInsertId = /last_insert_id\s*\(/i.test(r.texto);
  const temRowCount = /row_count\s*\(/i.test(r.texto);
  c.exerce("S03");
  c.exerce("S04");
  c.exerce("S05");
  for (const w of esc) {
    const base = w.tabela.replace(/^tb_/, "");
    const hist = cham.find((x) => x.nome === `sp_${base}_hist`);
    const arc = cham.find((x) => x.nome === `sp_${base}_arc`);
    const versionada = versionadas.has(w.tabela);
    const linha = w.cmd.linha;
    if (w.cmd.tipo === "UPDATE") {
      const depois = cham.some((x) => x.nome === `sp_${base}_hist` && x.cmd.ordem > w.cmd.ordem);
      if (!depois) add("S03", versionada ? `UPDATE em ${w.tabela} sem chamar sp_${base}_hist depois da operação.` : `UPDATE em ${w.tabela} sem chamar sp_${base}_hist. Se a tabela tem histórico, falta a chamada depois do UPDATE.`, linha, versionada ? "erro" : "aviso");
      else if (!temRowCount) add("S04", `UPDATE em ${w.tabela}: chame o histórico só se atingiu ≥ 1 linha (guarda ROW_COUNT() > 0).`, linha);
    } else if (w.cmd.tipo === "INSERT" || w.cmd.tipo === "REPLACE") {
      if (!hist) add("S03", versionada ? `INSERT em ${w.tabela} sem chamar sp_${base}_hist.` : `INSERT em ${w.tabela} sem chamar sp_${base}_hist. Se a tabela tem histórico, falta a chamada.`, linha, versionada ? "erro" : "aviso");
      else {
        if (!temLastInsertId) add("S04", `INSERT em ${w.tabela}: capture o LAST_INSERT_ID() antes de chamar o histórico.`, linha);
        if (!temRowCount) add("S04", `INSERT em ${w.tabela}: condicione o histórico a ROW_COUNT() > 0.`, linha);
      }
    } else if (w.cmd.tipo === "DELETE") {
      const antes = cham.some((x) => x.nome === `sp_${base}_arc` && x.cmd.ordem < w.cmd.ordem);
      if (!antes) add("S05", versionada ? `DELETE em ${w.tabela} sem chamar sp_${base}_arc ANTES do DELETE: o dado removido se perde.` : `DELETE em ${w.tabela} sem chamar sp_${base}_arc antes. Se a tabela tem archive, o dado se perde.`, linha, versionada || arc ? "erro" : "aviso");
      const temExists = /exists\s*\(/i.test(w.cmd.texto) && /_arc\b/i.test(w.cmd.texto);
      if (!temExists) add("S05", `O DELETE em ${w.tabela} não tem a guarda EXISTS sobre a tabela _arc: se o archive falhar, o DELETE apaga mesmo assim.`, linha, versionada || antes ? "erro" : "aviso");
    }
    // S06 (comando único que escreve em tabela versionada sem histórico) é tratado abaixo
  }

  // Q01 (chamadas e referências)
  for (const cmd of r.comandos) {
    for (const ref of referenciasDoComando(cmd)) {
      if (ref.schema !== null) continue;
      const crossSchema = /_(hist|arc)$/i.test(ref.nome) || (ref.via === "call" && /^sp_.+_(hist|arc)$/i.test(ref.nome));
      const convencao = /^(tb_|tr_|sp_)/i.test(ref.nome);
      if (!convencao) continue;
      add("Q01", crossSchema ? `${ref.nome} sem schema: é de outro schema (histórico/archive) e vai falhar ou atingir o objeto errado.` : `${ref.nome} sem schema. Qualifique: schema.${ref.nome}.`, ref.linha, crossSchema ? "erro" : "aviso");
    }
  }

  // S06 comando único
  c.exerce("S06");
  if (r.comandoUnico && r.tipo === "procedure" && !ehHistOuArc) {
    const grave = esc.length > 0 && esc.some((w) => versionadas.has(w.tabela)) && !cham.some((x) => /^sp_.+_(hist|arc)$/.test(x.nome));
    add("S06", grave ? `O corpo é um ${r.comandoUnico.tipo} só, escreve em tabela versionada e não chama o histórico.` : `O corpo é um ${r.comandoUnico.tipo} só. Em rotina de escrita isso costuma indicar que faltam histórico, ROW_COUNT ou archive.`, r.comandoUnico.linha, grave ? "erro" : "aviso");
  }

  // S08 lock
  if (r.tipo === "procedure" && ehLock) {
    c.exerce("S08");
    const texto = r.texto;
    const m = /get_lock\s*\(\s*'([^']*)'\s*,\s*(\d+)/i.exec(texto);
    if (!m) add("S08", "O wrapper de lock não chama GET_LOCK('<nome-do-wrapper>', 0).");
    else {
      if (m[1]!.toLowerCase() !== nome) add("S08", `A string do GET_LOCK ('${m[1]}') deve ser igual ao nome do wrapper (${r.nome}).`);
      if (m[2] !== "0") add("S08", `GET_LOCK com espera de ${m[2]}s: o wrapper single-runner usa 0 (sai sem esperar).`);
    }
    if (!/\bleave\b/i.test(texto)) add("S08", "Sem LEAVE para sair quando o lock não é obtido.");
    if (!/release_lock\s*\(/i.test(texto)) add("S08", "Sem RELEASE_LOCK.");
    if (!/exit\s+handler/i.test(texto) || !/\bresignal\b/i.test(texto)) add("S08", "Sem EXIT HANDLER que libera o lock e faz RESIGNAL em erro.");
  }

  // G01 para rotinas de dd
  c.exerce("G01");
  if ((r.schema ?? "").toLowerCase() === "dd") {
    const achadas = [...new Set(nome.split("_").filter((p) => PORTUGUES.has(p) || VERBOS.has(p) && /^(criar|apagar|alterar|ativar|desativar|bloquear)$/.test(p)))];
    if (achadas.length) add("G01", `Nome em português no schema dd: ${achadas.join(", ")}.`);
  }
}

function verificarComandos(comandos: readonly Comando[], rotinas: readonly Rotina[], modo: Modo, c: Coletor, tabelasDdl: readonly ParsedTable[]): void {
  c.exerce("A01");
  c.exerce("Q01");
  const todos: Array<{ cmd: Comando; onde: string; tipo: Violacao["tipoObjeto"] }> = [
    ...comandos.map((cmd) => ({ cmd, onde: "script", tipo: "comando" as const })),
    ...rotinas.flatMap((r) => r.comandos.map((cmd) => ({ cmd, onde: r.schema ? `${r.schema}.${r.nome}` : r.nome, tipo: "rotina" as const }))),
  ];
  for (const { cmd, onde, tipo } of todos) {
    if (cmd.tipo === "UPDATE" || cmd.tipo === "INSERT" || cmd.tipo === "REPLACE") {
      if (alvosDeAtribuicao(cmd).some((x) => x === "cod_projeto" || x === "cod_project")) {
        const alvo = referenciasDoComando(cmd).find((x) => x.via === "update" || x.via === "into");
        const raiz = alvo && /^tb_projeto$/i.test(alvo.nome);
        c.add("A01", modo, onde, tipo, raiz ? `${cmd.tipo} re-chaveia cod_projeto na tabela-raiz tb_projeto. Só é seguro com cascata em todas as filhas na mesma transação: isole numa rotina dedicada.` : `${cmd.tipo} atribui cod_projeto (SET ou ON DUPLICATE KEY UPDATE). cod_projeto é imutável: move a linha de um tenant para outro.`, cmd.linha, raiz ? "aviso" : "erro");
      }
    }
  }
  // Q01 em comandos soltos
  for (const cmd of comandos) {
    if (cmd.tipo === "CREATE" || cmd.tipo === "ALTER" || cmd.tipo === "DROP") {
      // CREATE TABLE sem schema é tratado nas tabelas; ALTER/DROP aqui.
      if (cmd.tipo === "CREATE") continue;
    }
    for (const ref of referenciasDoComando(cmd)) {
      if (ref.schema !== null || !/^(tb_|tr_|sp_)/i.test(ref.nome)) continue;
      const cross = /_(hist|arc)$/i.test(ref.nome) || (ref.via === "call" && /^sp_.+_(hist|arc)$/i.test(ref.nome));
      c.add("Q01", modo, "script", "comando", cross ? `${ref.nome} sem schema: é de outro schema (histórico/archive).` : `${ref.nome} sem schema. Qualifique: schema.${ref.nome}.`, ref.linha, cross ? "erro" : "aviso");
    }
  }
  void tabelasDdl;
}

// ---------- entrada principal ----------

export function verificarPadroes(texto: string, opcoes: OpcoesPadroes = OPCOES_PADRAO): ResultadoPadroes {
  const parse = parseDdl(texto);
  const rot = lerRotinas(texto);
  const leitura = { errors: parse.errors, ignored: parse.ignored, limitNotices: parse.limitNotices };
  const vazio: ResultadoPadroes = { tabelas: [], rotinas: [], violacoes: [], regrasVerificadas: [], regrasSemViolacao: [], leitura, rejeitado: parse.rejected || rot.rejeitado };
  if (vazio.rejeitado) return vazio;

  const { nomes: extensoes, raiz } = lerExtensoes(opcoes.extensoes);
  const coletor = new Coletor();
  const porNome = new Map<string, ParsedTable>();
  for (const t of parse.tables) porNome.set(t.name.toLowerCase(), t);

  // tabelas versionadas: as que têm uma tb_<nome>_hist no mesmo script
  const versionadas = new Set<string>();
  for (const t of parse.tables) {
    const n = t.name.toLowerCase();
    if (n.startsWith("tb_") && n.endsWith("_hist")) versionadas.add(n.slice(0, -5));
  }

  const infoTabelas: InfoTabela[] = [];
  for (const t of parse.tables) {
    const perfil = perfilDe(t.name, extensoes);
    const { modo, deduzido } = modoDaTabela(t, opcoes.modo);
    infoTabelas.push({ nome: t.name, schema: t.schema, perfil, modo, modoDeduzido: deduzido });
    regraGeral(t, perfil, modo, coletor, raiz, porNome);
    // Q01 para a tabela sem schema
    coletor.exerce("Q01");
    if (t.schema === null) coletor.add("Q01", modo, t.name, "tabela", `CREATE TABLE ${t.name} sem schema. Qualifique: schema.${t.name}.`, t.line);
  }

  // Modo das rotinas: o pedido; em "auto", legada só se todas as tabelas do script forem legadas.
  const modoRotinas: Modo = opcoes.modo !== "auto" ? opcoes.modo : infoTabelas.length > 0 && infoTabelas.every((x) => x.modo === "legada") ? "legada" : "nova";
  const infoRotinas: InfoRotina[] = [];
  for (const r of rot.rotinas) {
    infoRotinas.push({ nome: r.nome, schema: r.schema, tipo: r.tipo, modo: modoRotinas });
    verificarRotina(r, modoRotinas, versionadas, coletor);
  }
  verificarComandos(rot.comandosSoltos, rot.rotinas, modoRotinas, coletor, parse.tables);

  const verificadas = [...coletor.exercidas].sort();
  const comViolacao = new Set(coletor.violacoes.map((v) => v.regra));
  const ordemSev: Record<Severidade, number> = { erro: 0, aviso: 1 };
  const ordemRegra = new Map(CATALOGO.map((r, i) => [r.id, i] as const));
  const violacoes = [...coletor.violacoes].sort(
    (a, b) =>
      a.objeto.localeCompare(b.objeto) ||
      ordemSev[a.severidade] - ordemSev[b.severidade] ||
      (ordemRegra.get(a.regra) ?? 0) - (ordemRegra.get(b.regra) ?? 0) ||
      (a.linha ?? 0) - (b.linha ?? 0) ||
      a.detalhe.localeCompare(b.detalhe),
  );
  return {
    tabelas: infoTabelas,
    rotinas: infoRotinas,
    violacoes,
    regrasVerificadas: verificadas,
    regrasSemViolacao: verificadas.filter((id) => !comViolacao.has(id)),
    leitura,
    rejeitado: false,
  };
}

export type { ParsedIndex };
