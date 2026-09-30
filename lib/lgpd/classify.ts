import type { ParsedColumn, ParsedTable } from "../sql/types";
import {
  APELIDOS,
  DESCARTAR,
  END_NAO_ENDERECO,
  NAO_PLURAL,
  REGRAS,
  TABELA_CARTAO,
  TABELA_CONTA,
  TABELA_ENDERECO,
  TABELA_FINANCEIRO,
  TABELA_LOG,
  TABELA_NAO_PESSOA,
  TABELA_PESSOA,
  TABELA_RESPONSAVEL,
  TABELA_SAUDE,
  VOCAB_FORA_DO_CONTEXTO,
  VOCAB_PROTECAO,
} from "./rules/pt-br";
import { contem, familiaDoTipo, igual, singular, tokens as tokensDe, type DicionarioTexto } from "./text";
import {
  CATEGORIAS,
  type Categoria,
  type ClassificacaoColuna,
  type Confianca,
  type ContextoTabela,
  type FamiliaTipo,
  type Pessoal,
  type Regra,
  type SinalMotivo,
} from "./types";

export const DICIONARIO: DicionarioTexto = {
  apelidos: APELIDOS,
  descartar: DESCARTAR,
  endNaoEndereco: END_NAO_ENDERECO,
};

export const PONTUACAO_MINIMA = 5;
export const LIMIAR_MEDIA = 7;
export const LIMIAR_ALTA = 9;

export interface ContextoCalculado {
  /** Conjunto de rótulos que valem para a tabela (inclui um de pessoa/nao_pessoa/neutro). */
  rotulos: ReadonlySet<ContextoTabela>;
  tipo: "pessoa" | "nao_pessoa" | "neutro";
  /** Por que a tabela foi lida assim. Vai para o motivo. */
  porque: string;
}

interface Candidato {
  regra: Regra;
  indice: number;
  pontuacao: number;
  sinais: SinalMotivo[];
  casouPeloNome: boolean;
}

// ---------- contexto da tabela ----------

function tokensDaTabela(nome: string): string[] {
  return tokensDe(nome, DICIONARIO).map((t) => singular(t, NAO_PLURAL));
}

function temAlgum(tokens: readonly string[], conjunto: ReadonlySet<string>): boolean {
  return tokens.some((t) => conjunto.has(t));
}

/** Pontua `coluna` só pelo nome (sem contexto). Usado para inferir se a tabela é de pessoas. */
function ehEvidenciaDePessoa(coluna: ParsedColumn): boolean {
  const toks = tokensDe(coluna.name, DICIONARIO);
  for (const r of REGRAS) {
    if (!r.evidenciaPessoa || r.peso < 6) continue;
    for (const p of r.padroes) {
      if (contem(toks, p)) return true;
    }
  }
  return false;
}

export function contextoDaTabela(tabela: ParsedTable): ContextoCalculado {
  const toks = tokensDaTabela(tabela.name);
  const comentario = tabela.comment ? tokensDe(tabela.comment, DICIONARIO) : [];
  const rotulos = new Set<ContextoTabela>();

  if (temAlgum(toks, TABELA_ENDERECO)) rotulos.add("endereco");
  if (temAlgum(toks, TABELA_LOG)) rotulos.add("log");
  if (temAlgum(toks, TABELA_CARTAO)) rotulos.add("cartao");
  if (temAlgum(toks, TABELA_CONTA)) rotulos.add("conta");
  if (temAlgum(toks, TABELA_FINANCEIRO)) rotulos.add("financeiro");
  if (temAlgum(toks, TABELA_SAUDE)) rotulos.add("saude");
  if (temAlgum(toks, TABELA_RESPONSAVEL)) rotulos.add("responsavel");

  const dePessoa = temAlgum(toks, TABELA_PESSOA);
  const deCoisa = temAlgum(toks, TABELA_NAO_PESSOA) || contem(comentario, ["pessoa", "juridica"]);

  let tipo: ContextoCalculado["tipo"];
  let porque: string;
  if (dePessoa && !deCoisa) {
    tipo = "pessoa";
    porque = `o nome da tabela "${tabela.name}" indica pessoas`;
  } else if (deCoisa && !dePessoa) {
    tipo = "nao_pessoa";
    porque = `o nome (ou o COMMENT) da tabela "${tabela.name}" indica coisas ou empresas, não pessoas`;
  } else if (dePessoa && deCoisa) {
    tipo = "neutro";
    porque = `o nome da tabela "${tabela.name}" mistura pessoas e coisas`;
  } else {
    const evidencias = tabela.columns.filter(ehEvidenciaDePessoa).length;
    if (evidencias >= 2) {
      tipo = "pessoa";
      porque = `a tabela "${tabela.name}" tem ${evidencias} colunas que só fazem sentido para pessoas (CPF, e-mail, telefone...)`;
    } else {
      tipo = "neutro";
      porque = `o nome da tabela "${tabela.name}" não diz se guarda pessoas`;
    }
  }
  rotulos.add(tipo);
  return { rotulos, tipo, porque };
}

// ---------- classificação de coluna ----------

function compativel(familia: FamiliaTipo, aceitas: readonly FamiliaTipo[]): boolean {
  if (aceitas.includes(familia)) return true;
  return familia === "texto_longo" && aceitas.includes("texto");
}

function bonusDeContexto(regra: Regra, ctx: ContextoCalculado): number {
  if (!regra.contexto) return 0;
  let total = 0;
  for (const rotulo of ctx.rotulos) total += regra.contexto[rotulo] ?? 0;
  return total;
}

function avaliarRegra(
  regra: Regra,
  indice: number,
  nome: readonly string[],
  comentario: readonly string[],
  familia: FamiliaTipo,
  ctx: ContextoCalculado,
  tipoSql: string,
  nomeTabela: string,
): Candidato | null {
  let melhor: Candidato | null = null;
  for (const padrao of regra.padroes) {
    const exato = igual(nome, padrao);
    const parcial = !exato && !regra.exata && contem(nome, padrao);
    const noComentario = !regra.exata && contem(comentario, padrao);
    if (!exato && !parcial && !noComentario) continue;

    const sinais: SinalMotivo[] = [];
    let pontos = regra.peso;
    // Mostra a palavra que casou e, se ela não é o próprio rótulo, o que ela significa: contém "sanguineo" (saúde).
    const palavra = padrao.join(" ");
    const citado = palavra === regra.rotulo.toLowerCase() ? `"${regra.rotulo}"` : `"${palavra}" (${regra.rotulo})`;
    if (exato) {
      pontos += 2;
      sinais.push({ tipo: "nome", texto: `o nome da coluna é ${citado}` });
    } else if (parcial) {
      pontos += 1;
      sinais.push({ tipo: "nome", texto: `o nome da coluna contém ${citado}` });
    }
    if (noComentario) {
      pontos += 2;
      sinais.push({ tipo: "comentario", texto: `o COMMENT da coluna cita ${citado}` });
    }
    if (padrao.length > 1) pontos += 1;
    if (regra.tipos) {
      if (compativel(familia, regra.tipos)) {
        pontos += 1;
        sinais.push({ tipo: "tipo", texto: `o tipo ${tipoSql} combina` });
      } else {
        pontos -= 2;
        sinais.push({ tipo: "tipo", texto: `o tipo ${tipoSql} não é o esperado` });
      }
    }
    const ctxBonus = bonusDeContexto(regra, ctx);
    pontos += ctxBonus;
    if (ctxBonus > 0) {
      sinais.push({ tipo: "tabela", texto: explicaContexto(ctx, nomeTabela) });
    } else if (ctxBonus < 0) {
      sinais.push({ tipo: "tabela", texto: explicaContexto(ctx, nomeTabela) });
    }

    const candidato: Candidato = {
      regra,
      indice,
      pontuacao: pontos,
      sinais,
      casouPeloNome: exato || parcial,
    };
    if (!melhor || candidato.pontuacao > melhor.pontuacao) melhor = candidato;
  }
  return melhor;
}

function explicaContexto(ctx: ContextoCalculado, _tabela: string): string {
  return ctx.porque;
}

function precedencia(c: Categoria): number {
  return CATEGORIAS.indexOf(c);
}

function confiancaDe(pontos: number): Confianca {
  if (pontos >= LIMIAR_ALTA) return "alta";
  if (pontos >= LIMIAR_MEDIA) return "media";
  return "baixa";
}

function temProtecao(nome: readonly string[], familia: FamiliaTipo): boolean {
  return familia === "binario" || nome.some((t) => VOCAB_PROTECAO.has(t));
}

/** Chave estrangeira declarada no DDL (FOREIGN KEY ... REFERENCES). É um sinal de ESTRUTURA, não de nome. */
export interface InfoFk {
  tabelaReferenciada: string;
  /** A tabela referenciada está no mesmo DDL e parece um catálogo (coisas, não pessoas). */
  paraCatalogo: boolean;
}

export const PONTUACAO_FK = 10;
export const PONTUACAO_FK_CATALOGO = 12;

const REGRA_FK: Regra = {
  id: "nid.fk",
  categoria: "nao_identificado",
  padroes: [],
  peso: PONTUACAO_FK,
  rotulo: "chave estrangeira",
  fontes: ["LGPD-5-I"],
  nota: "Chave estrangeira declarada aponta para outra tabela e não identifica ninguém sozinha.",
};

export function classificarColuna(
  tabela: ParsedTable,
  coluna: ParsedColumn,
  ctx: ContextoCalculado,
  regras: readonly Regra[] = REGRAS,
  fk: InfoFk | null = null,
): ClassificacaoColuna {
  const nome = tokensDe(coluna.name, DICIONARIO);
  const comentario = coluna.comment ? tokensDe(coluna.comment, DICIONARIO) : [];
  const familia = familiaDoTipo(coluna.baseType, coluna.typeArgs);

  const candidatos: Candidato[] = [];
  regras.forEach((regra, indice) => {
    const c = avaliarRegra(regra, indice, nome, comentario, familia, ctx, coluna.rawType, tabela.name);
    if (c && c.pontuacao >= PONTUACAO_MINIMA) candidatos.push(c);
  });
  if (fk) {
    const catalogo = fk.paraCatalogo;
    candidatos.push({
      regra: REGRA_FK,
      indice: regras.length,
      pontuacao: catalogo ? PONTUACAO_FK_CATALOGO : PONTUACAO_FK,
      sinais: [
        {
          tipo: "tabela",
          texto: catalogo
            ? `a coluna é chave estrangeira declarada para "${fk.tabelaReferenciada}", que é uma tabela de catálogo`
            : `a coluna é chave estrangeira declarada para "${fk.tabelaReferenciada}"`,
        },
      ],
      casouPeloNome: false,
    });
  }
  // Regra genérica (fraca) só vale quando nenhuma regra específica casou.
  const especificos = candidatos.filter((c) => !c.regra.fraca);
  const validos = especificos.length > 0 ? especificos : candidatos;
  let vencedor: Candidato | null = null;
  for (const c of validos) {
    if (!vencedor) {
      vencedor = c;
      continue;
    }
    const a = c.regra.categoria;
    const b = vencedor.regra.categoria;
    if (c.pontuacao > vencedor.pontuacao || (c.pontuacao === vencedor.pontuacao && precedencia(a) < precedencia(b))) {
      vencedor = c;
    }
  }

  const base = {
    tabela: tabela.name,
    coluna: coluna.name,
    tipoSql: coluna.rawType,
    protecaoAparente: temProtecao(nome, familia),
    origem: "regra" as const,
  };

  if (!vencedor) {
    return {
      ...base,
      categoria: "nao_identificado",
      subtipo: null,
      pessoal: "nao",
      sensivel: false,
      altoRisco: false,
      confianca: "baixa",
      motivo: "nada no nome, no tipo ou no COMMENT da coluna indica dado pessoal",
      ruleId: null,
      pontuacao: 0,
      fontes: ["LGPD-5-I"],
      nota: null,
    };
  }

  const v: Candidato = vencedor;
  const categoria = v.regra.categoria;
  const pessoal: Pessoal = v.regra.pessoal ?? (categoria === "nao_identificado" ? "nao" : "sim");
  const motivo = v.sinais.map((s) => s.texto).join("; ");
  return {
    ...base,
    categoria,
    subtipo: v.regra.subtipo ?? null,
    pessoal,
    sensivel: categoria === "sensivel",
    altoRisco: categoria === "financeiro",
    confianca: confiancaDe(v.pontuacao),
    motivo: motivo === "" ? `regra ${v.regra.id}` : motivo,
    ruleId: v.regra.id,
    pontuacao: v.pontuacao,
    fontes: v.regra.fontes,
    nota: v.regra.nota ?? null,
  };
}


// ---------- contexto da tabela (segunda passada) ----------

export const REGRA_CONTEXTO_ID = "out.contexto_da_tabela";

/**
 * Coluna sem nenhuma regra, numa tabela que tem identificador direto de pessoa (CPF, e-mail, nome...),
 * provavelmente descreve essa pessoa. A lei define dado pessoal como "informação relacionada a pessoa
 * natural identificada ou identificável" (art. 5º, I): não é o nome da coluna que faz dado pessoal,
 * é a ligação com a pessoa. Confiança sempre BAIXA, e "depende": é uma suposição pelo contexto.
 *
 * Fica de fora: chave primária e estrangeira, colunas de sistema, credencial e estado (ver
 * VOCAB_FORA_DO_CONTEXTO) e colunas booleanas.
 */
export function aplicarContextoDaTabela(
  tabela: ParsedTable,
  colunas: readonly ClassificacaoColuna[],
  ctx: ContextoCalculado,
  fkCols: ReadonlySet<string>,
): ClassificacaoColuna[] {
  const temIdentificadorDePessoa = colunas.some((c) => c.categoria === "identificador_direto" && c.pessoal === "sim");
  if (!temIdentificadorDePessoa || ctx.tipo === "nao_pessoa") return [...colunas];
  return colunas.map((c, i) => {
    if (c.ruleId !== null || c.categoria !== "nao_identificado" || c.origem !== "regra") return c;
    const col = tabela.columns[i] as ParsedColumn;
    const toks = tokensDe(col.name, DICIONARIO);
    const familia = familiaDoTipo(col.baseType, col.typeArgs);
    if (col.isPrimaryKey || fkCols.has(col.name) || familia === "booleano") return c;
    if (toks.some((t) => VOCAB_FORA_DO_CONTEXTO.has(t))) return c;
    return {
      ...c,
      categoria: "outro_dado_pessoal",
      pessoal: "depende",
      confianca: "baixa",
      motivo: `contexto da tabela: "${tabela.name}" tem identificador direto de pessoa, então esta coluna provavelmente descreve essa pessoa (nenhuma regra casou com o nome)`,
      ruleId: REGRA_CONTEXTO_ID,
      pontuacao: 0,
      fontes: ["LGPD-5-I"],
      nota: "Suposição pelo contexto: dado relacionado a pessoa identificada é dado pessoal (art. 5º, I), mesmo com nome de coluna comum. Confira e corrija se não for.",
    };
  });
}
