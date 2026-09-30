/**
 * Medição publicada da Tarja. Os números vêm da única execução dos corpora v2
 * (docs/validation-runs-v2.md); um teste confere que este arquivo e o registro dizem a mesma coisa.
 * A interface e o README usam estes valores, então a frase na tela nunca fica diferente da medida.
 */
export const MEDICAO = {
  rodada: "v2",
  /** Corpus que não escrevi (Northwind, Chinook, OpenEMR). É a medida que mais se aproxima de um schema de terceiros. */
  externo: { corpus: "external-v2", precisao: 0.73, recall: 0.9 },
  /** Schemas fictícios meus, gabarito escrito antes das regras. */
  validacao: { corpus: "validation-v2", precisao: 0.87, recall: 0.94 },
} as const;

/** "1 em cada N": o inverso da taxa, arredondado. */
function umEmCada(taxa: number): number {
  return Math.max(1, Math.round(1 / taxa));
}

/** Texto fixo, na tela e no README. Usa o pior dos dois corpora v2, e diz de onde vem. */
export function fraseDeDesempenho(): string {
  const passou = umEmCada(1 - Math.min(MEDICAO.externo.recall, MEDICAO.validacao.recall));
  const alarmeFalso = umEmCada(1 - Math.min(MEDICAO.externo.precisao, MEDICAO.validacao.precisao));
  return (
    `Fora dos nomes que as regras conhecem, a Tarja deixou passar cerca de 1 em cada ${passou} colunas com dado pessoal ` +
    `e marcou a mais cerca de 1 em cada ${alarmeFalso} colunas que apontou (medição ${MEDICAO.rodada}, uma única execução). ` +
    `"Não identificado pelas regras" quer dizer que a Tarja não achou pista, não que não há dado pessoal: revise.`
  );
}
