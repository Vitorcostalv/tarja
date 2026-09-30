import { rotuloCategoria } from "../lib/lgpd/report";
import type { ClassificacaoColuna } from "../lib/lgpd/types";

const CURTO: Record<string, string> = {
  identificador_direto: "Identificador",
  localizacao: "Localização",
  financeiro: "Financeiro",
  crianca_adolescente: "Criança/adolesc.",
  sensivel: "Sensível",
  outro_dado_pessoal: "Outro dado pessoal",
};

/** Texto do carimbo de uma coluna. Só "Sensível" usa a cor de destaque. */
export function textoDoCarimbo(c: ClassificacaoColuna, semRegra: boolean): string {
  if (c.categoria === "nao_identificado") return semRegra ? "Sem pista" : "Não pessoal";
  return CURTO[c.categoria] ?? rotuloCategoria(c.categoria);
}

export function Carimbo({ c, semRegra, pequeno = false }: { c: ClassificacaoColuna; semRegra: boolean; pequeno?: boolean }) {
  const cinza = c.categoria === "nao_identificado";
  const classe = ["carimbo", cinza ? "cinza" : "", c.sensivel ? "sensivel" : "", pequeno ? "pequeno" : ""].filter(Boolean).join(" ");
  return <span className={classe}>{textoDoCarimbo(c, semRegra)}</span>;
}
