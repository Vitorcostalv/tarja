import type { Categoria, ClassificacaoColuna, Pessoal, SubtipoSensivel } from "./types";

/** Correção feita à mão pelo usuário. Entra no relatório com origem "manual". */
export interface Correcao {
  categoria: Categoria;
  subtipo?: SubtipoSensivel | null;
  pessoal?: Pessoal;
}

export function aplicarCorrecao(original: ClassificacaoColuna, correcao: Correcao): ClassificacaoColuna {
  const categoria = correcao.categoria;
  const pessoal: Pessoal = correcao.pessoal ?? (categoria === "nao_identificado" ? "nao" : "sim");
  return {
    ...original,
    categoria,
    subtipo: categoria === "sensivel" ? (correcao.subtipo ?? null) : null,
    pessoal,
    sensivel: categoria === "sensivel",
    altoRisco: categoria === "financeiro",
    confianca: "alta",
    motivo: `corrigido à mão (a regra tinha sugerido "${original.categoria}")`,
    ruleId: null,
    fontes: original.fontes,
    nota: null,
    origem: "manual",
  };
}
