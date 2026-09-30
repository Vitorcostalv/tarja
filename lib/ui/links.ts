/**
 * Links de NAVEGAÇÃO (o usuário clica e vai). Nunca são requisitados pela página.
 * O teste de segurança libera URLs absolutas só neste arquivo e em lib/lgpd/rules/fontes.ts.
 */
export const SITE_URL = "https://tarja-lgpd.vercel.app";

export const LINKS = {
  repositorio: "https://github.com/Vitorcostalv/tarja",
  lei: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm",
  anpd: "https://www.gov.br/anpd/pt-br",
} as const;
