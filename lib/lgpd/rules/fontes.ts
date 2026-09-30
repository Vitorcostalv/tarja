/**
 * Registro das fontes citadas pelas regras. Cada ID aponta para um arquivo em docs/research/.
 * Um teste garante que toda regra cita pelo menos uma fonte que existe aqui.
 */
export interface Fonte {
  titulo: string;
  url: string;
  arquivo: string;
  /** Data de acesso (AAAA-MM-DD), conforme docs/research. */
  acessadoEm: string;
}

const PLANALTO = "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm";
const ANPD_SEG =
  "https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte";
const ANPD_RIPD =
  "https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/relatorio-de-impacto-a-protecao-de-dados-pessoais-ripd";

const lei = (titulo: string): Fonte => ({
  titulo,
  url: PLANALTO,
  arquivo: "docs/research/01-lei-13709-planalto.md",
  acessadoEm: "2026-09-30",
});

export const FONTES: Readonly<Record<string, Fonte>> = {
  "LGPD-5-I": lei("Lei 13.709/2018, art. 5º, I (dado pessoal)"),
  "LGPD-5-II": lei("Lei 13.709/2018, art. 5º, II (dado pessoal sensível)"),
  "LGPD-5-XI": lei("Lei 13.709/2018, art. 5º, XI (anonimização)"),
  "LGPD-5-XVII": lei("Lei 13.709/2018, art. 5º, XVII (relatório de impacto)"),
  "LGPD-6-III": lei("Lei 13.709/2018, art. 6º, III (necessidade)"),
  "LGPD-6-VII": lei("Lei 13.709/2018, art. 6º, VII (segurança)"),
  "LGPD-7": lei("Lei 13.709/2018, art. 7º (bases legais)"),
  "LGPD-11": lei("Lei 13.709/2018, art. 11 (bases legais para dado sensível)"),
  "LGPD-12": lei("Lei 13.709/2018, art. 12 (dado anonimizado)"),
  "LGPD-13-4": lei("Lei 13.709/2018, art. 13, § 4º (pseudonimização)"),
  "LGPD-14": lei("Lei 13.709/2018, art. 14 (crianças e adolescentes)"),
  "LGPD-15": lei("Lei 13.709/2018, art. 15 (término do tratamento)"),
  "LGPD-16": lei("Lei 13.709/2018, art. 16 (eliminação)"),
  "LGPD-37": lei("Lei 13.709/2018, art. 37 (registro das operações)"),
  "LGPD-38": lei("Lei 13.709/2018, art. 38 (relatório de impacto)"),
  "LGPD-46": lei("Lei 13.709/2018, art. 46 (medidas de segurança)"),
  "ANPD-SEG-45": {
    titulo: "ANPD, Guia de segurança para agentes de pequeno porte, item 45 (minimização)",
    url: ANPD_SEG,
    arquivo: "docs/research/02-anpd-seguranca-pequeno-porte.md",
    acessadoEm: "2026-09-30",
  },
  "ANPD-SEG-46": {
    titulo: "ANPD, Guia de segurança para agentes de pequeno porte, item 46 (dado sensível, pseudonimização)",
    url: ANPD_SEG,
    arquivo: "docs/research/02-anpd-seguranca-pequeno-porte.md",
    acessadoEm: "2026-09-30",
  },
  "ANPD-RIPD-DEF": {
    titulo: "ANPD, perguntas e respostas sobre o RIPD",
    url: ANPD_RIPD,
    arquivo: "docs/research/03-anpd-ripd.md",
    acessadoEm: "2026-09-30",
  },
};

export function fonteExiste(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(FONTES, id);
}
