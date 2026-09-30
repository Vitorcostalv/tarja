import type { ParsedTable } from "../sql/types";
import { DICIONARIO } from "./classify";
import {
  TABELA_CRIANCA,
  TABELA_LOG,
  VOCAB_CRIACAO,
  VOCAB_EXCLUSAO,
  VOCAB_TEXTO_LIVRE,
} from "./rules/pt-br";
import { familiaDoTipo, singular, tokens as tokensDe } from "./text";
import { NAO_PLURAL } from "./rules/pt-br";
import type { Achado, ClassificacaoColuna, Gravidade } from "./types";

/**
 * Achados estruturais do schema. Cada um tem critério explícito, gravidade e fonte.
 * Sem achado "por precaução": se o critério não fecha, não aparece.
 */

export const ACHADOS_IDS = [
  "SEM_CICLO_DE_VIDA",
  "TEXTO_LIVRE",
  "SENSIVEL_SEM_PROTECAO",
  "PESSOAL_EM_LOG",
  "INDICIO_MENOR",
] as const;
export type AchadoId = (typeof ACHADOS_IDS)[number];

function tokensDaTabela(nome: string): string[] {
  return tokensDe(nome, DICIONARIO).map((t) => singular(t, NAO_PLURAL));
}

function compara(a: Achado, b: Achado): number {
  const ordem: Record<Gravidade, number> = { alta: 0, media: 1, baixa: 2 };
  return (
    ordem[a.gravidade] - ordem[b.gravidade] ||
    a.id.localeCompare(b.id) ||
    a.tabela.localeCompare(b.tabela) ||
    (a.coluna ?? "").localeCompare(b.coluna ?? "")
  );
}

export function gerarAchados(tabela: ParsedTable, classificacoes: readonly ClassificacaoColuna[]): Achado[] {
  const achados: Achado[] = [];
  const pessoais = classificacoes.filter((c) => c.pessoal === "sim");
  const temSensivel = classificacoes.some((c) => c.sensivel);
  const nomesTabela = tokensDaTabela(tabela.name);
  const tabelaDeLog = nomesTabela.some((t) => TABELA_LOG.has(t));
  const tokensColunas = tabela.columns.map((c) => ({ coluna: c, tokens: tokensDe(c.name, DICIONARIO) }));

  // 1. Sem ciclo de vida: dificulta saber quando eliminar (arts. 15 e 16).
  if (pessoais.length > 0) {
    const temData = tokensColunas.some(
      ({ tokens }) => tokens.some((t) => VOCAB_CRIACAO.has(t)) || tokens.some((t) => VOCAB_EXCLUSAO.has(t)),
    );
    const logComTempo =
      tabelaDeLog && tokensColunas.some(({ coluna }) => familiaDoTipo(coluna.baseType, coluna.typeArgs) === "data");
    if (!temData && !logComTempo) {
      achados.push({
        id: "SEM_CICLO_DE_VIDA",
        gravidade: temSensivel ? "alta" : "media",
        tabela: tabela.name,
        coluna: null,
        titulo: "Dado pessoal sem data de criação nem exclusão lógica",
        explicacao:
          "A tabela guarda dado pessoal mas não tem coluna que diga quando o registro foi criado, nem marca de exclusão (deleted_at). Sem isso fica difícil aplicar prazo de retenção e eliminar o dado quando a finalidade acabar. Um booleano \"ativo\" não conta: ele pode ser só status.",
        fontes: ["LGPD-15", "LGPD-16"],
      });
    }
  }

  // 2. Texto livre numa tabela que já tem dado pessoal.
  for (const { coluna, tokens } of tokensColunas) {
    if (familiaDoTipo(coluna.baseType, coluna.typeArgs) !== "texto_longo") continue;
    if (!tokens.some((t) => VOCAB_TEXTO_LIVRE.has(t))) continue;
    const outrasPessoais = pessoais.some((p) => p.coluna !== coluna.name);
    if (!outrasPessoais) continue;
    achados.push({
      id: "TEXTO_LIVRE",
      gravidade: temSensivel ? "alta" : "media",
      tabela: tabela.name,
      coluna: coluna.name,
      titulo: "Campo de texto livre pode conter dado pessoal",
      explicacao:
        "Quem digita num campo livre coloca de tudo: CPF, telefone, saúde, nome de terceiros. Não dá para saber o que tem ali só olhando o schema. Vale orientar quem preenche, limitar o uso e incluir o campo nas buscas de eliminação.",
      fontes: ["LGPD-6-III", "ANPD-SEG-45"],
    });
  }

  // 3. Dado sensível sem indício de proteção no nome ou no tipo.
  for (const c of classificacoes) {
    if (!c.sensivel || c.protecaoAparente) continue;
    achados.push({
      id: "SENSIVEL_SEM_PROTECAO",
      gravidade: "alta",
      tabela: c.tabela,
      coluna: c.coluna,
      titulo: "Dado sensível sem indício de proteção",
      explicacao:
        "Nada no nome nem no tipo da coluna sugere que ela esteja cifrada, com hash ou tokenizada. O schema não mostra a cifra feita na aplicação ou no disco, então isto é um indício, não uma prova. A ANPD sugere técnicas que dificultem identificar o titular, como pseudonimização e criptografia, para quem guarda dado sensível.",
      fontes: ["LGPD-46", "ANPD-SEG-46"],
    });
  }

  // 4. Dado pessoal em tabela de log.
  if (tabelaDeLog && pessoais.length > 0) {
    achados.push({
      id: "PESSOAL_EM_LOG",
      gravidade: "media",
      tabela: tabela.name,
      coluna: null,
      titulo: "Dado pessoal em tabela de log",
      explicacao:
        "Logs costumam crescer para sempre e ninguém olha para eles na hora de eliminar dados. IP, e-mail e identificadores em log são dado pessoal e precisam de prazo de retenção, como qualquer outro.",
      fontes: ["LGPD-16", "LGPD-6-III"],
    });
  }

  // 5. Indício de dado de criança ou adolescente.
  const colunaDeMenor = classificacoes.some((c) => c.categoria === "crianca_adolescente");
  const nomeDeMenor = nomesTabela.some((t) => TABELA_CRIANCA.has(t));
  if (colunaDeMenor || nomeDeMenor) {
    achados.push({
      id: "INDICIO_MENOR",
      gravidade: "alta",
      tabela: tabela.name,
      coluna: null,
      titulo: "Indício de dado de criança ou adolescente",
      explicacao:
        "O nome da tabela ou alguma coluna (responsável legal, menor de idade) sugere que há dado de menores. Pela lei, o tratamento deve ser feito no melhor interesse da criança, e o de crianças exige consentimento específico e em destaque de pelo menos um dos pais ou do responsável. É só um indício: a Tarja não sabe a idade de ninguém.",
      fontes: ["LGPD-14"],
    });
  }

  return achados.sort(compara);
}
