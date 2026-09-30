import { writeFileSync } from "node:fs";
import { CATALOGO, SECOES } from "../lib/ddl/catalogo";

/**
 * Gera docs/padroes-ddl-v2.md a partir do catálogo (a mesma fonte que a tela e o verificador usam).
 * Um teste falha se o arquivo commitado diferir do que este script gera.
 */
export function documentoDosPadroes(): string {
  const sev = (r: (typeof CATALOGO)[number]) =>
    typeof r.severidade === "string"
      ? r.severidade === "erro" ? "erro" : "aviso"
      : `${r.severidade.nova === "erro" ? "erro" : "aviso"} em tabela nova, ${r.severidade.legada === "erro" ? "erro" : "aviso"} em legada`;
  const linhas: string[] = [
    "# Padrões de DDL (v2)",
    "",
    "> Gerado de `lib/ddl/catalogo.ts` por `npm run doc:padroes`. Não edite à mão: edite o catálogo.",
    "",
    "Convenções de DDL para MySQL definidas pelo **autor do projeto** (charset latin1, multi-tenant por `cod_projeto`). Não são a LGPD, não são lei e não vêm de fonte oficial: valem para quem adota o padrão.",
    "",
    "## Como o verificador reporta",
    "",
    "| Severidade | Significado |",
    "|---|---|",
    "| ERRO | Não roda, quebra, ou viola convenção obrigatória. |",
    "| AVISO | Convenção ou boa prática que depende de intenção, ou item legado a migrar. |",
    "",
    "**Tabela nova × legada.** Várias regras têm dois alvos. No modo *legada*, itens de migração são aviso; no modo *nova*, os mesmos itens são erro. O modo é escolhido na tela ou, em automático, deduzido do charset (`latin1` = legada, `utf8mb4` = nova), e a tela diz qual foi assumido.",
    "",
  ];
  for (const secao of SECOES) {
    const regras = CATALOGO.filter((r) => r.secao === secao);
    if (regras.length === 0) continue;
    linhas.push(`## ${secao}`, "");
    for (const r of regras) {
      linhas.push(`### ${r.id}: ${r.titulo}`, "", `*Severidade: ${sev(r)}.*`, "", r.explicacao, "");
    }
  }
  linhas.push(
    "## Lacunas conhecidas (o que o verificador NÃO consegue saber)",
    "",
    "- **Chave opcional × obrigatória (D04):** o DDL não diz se uma FK `cod_` é opcional; `DEFAULT '0'` numa FK é sempre aviso. Só `cod_projeto` é erro.",
    "- **Associação N:N e lookup legada (E08):** a ferramenta avisa que falta `cod_projeto` e você confirma.",
    "- **Tabela versionada (S03 a S05):** a ferramenta só sabe que uma tabela tem histórico se a `tb_<nome>_hist` estiver no mesmo script. Sem ela, a ausência de chamada ao histórico vira aviso, não erro.",
    "- **Qualificação de schema (Q01):** só confere nomes que começam com `tb_`, `tr_` ou `sp_`. Não sabe qual é o schema padrão da sessão, então referência sem schema a objeto do mesmo schema é aviso.",
    "- **Schema `dd` em inglês (G01):** usa uma lista pequena de palavras em português. Palavra fora da lista passa.",
    "- **Perfil extensão (X01):** a ferramenta não adivinha qual tabela é extensão: você informa nas opções (`tb_site_gf:tb_site`).",
    "- **`sql_mode` (D04):** a regra só vale com modo estrito no servidor; o DDL não mostra isso.",
    "- **Repertório latin1 (C01):** não dá para saber, pelo DDL, se a aplicação grava emoji ou aspas tipográficas.",
    "- **Não implementado:** o par denormalizado `cod_X` + `X` e o uso dominante de `dh_` (§11), e o `ALTER TABLE` (só `CREATE`, `UPDATE`, `INSERT`, `DELETE`, `CALL` e rotinas são lidos).",
    "- **Leitura de rotinas:** o leitor acha comandos de escrita, chamadas e `DEFINER` por heurística de tokens, não por um parser completo de SQL procedural. Corpo muito incomum pode escapar.",
    "",
  );
  return linhas.join("\n");
}

if ((process.argv[1] ?? "").replace(/\\/g, "/").endsWith("scripts/gerar-doc-padroes.ts")) {
  writeFileSync("docs/padroes-ddl-v2.md", documentoDosPadroes(), "utf8");
  console.log("docs/padroes-ddl-v2.md gravado");
}
