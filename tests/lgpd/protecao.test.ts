import { describe, expect, it } from "vitest";
import { analisarDdl } from "../../lib/lgpd/analyze";
import { TECNICAS, sugerirProtecao } from "../../lib/lgpd/rules/protecao";
import type { ClassificacaoColuna } from "../../lib/lgpd/types";

function col(tabela: string, definicao: string): ClassificacaoColuna {
  return analisarDdl(`CREATE TABLE ${tabela} (${definicao});`).analise.tabelas[0]!.colunas[0]!;
}
const tecnicas = (c: ClassificacaoColuna) => sugerirProtecao(c).map((s) => s.tecnica);

describe("sugestões de proteção", () => {
  it("coluna sem dado pessoal não recebe sugestão", () => {
    expect(sugerirProtecao(col("produtos", "nome VARCHAR(50)"))).toEqual([]);
    expect(sugerirProtecao(col("pedidos", "id INT"))).toEqual([]);
  });

  it("toda coluna pessoal começa pela minimização ('você precisa mesmo coletar isso?')", () => {
    for (const [t, d] of [
      ["clientes", "cpf CHAR(11)"], ["clientes", "endereco VARCHAR(80)"], ["contas", "saldo DECIMAL(10,2)"],
      ["pacientes", "diagnostico TEXT"], ["alunos", "nome_responsavel VARCHAR(80)"], ["clientes", "sexo CHAR(1)"],
    ] as const) {
      const s = sugerirProtecao(col(t, d));
      expect(s[0]!.tecnica, d).toBe("minimizacao");
      expect(s[0]!.dica).toMatch(/Você precisa mesmo coletar isso/);
    }
  });

  it("CPF: mascaramento no formato ***.123.456-**, criptografia e hash com sal", () => {
    const s = sugerirProtecao(col("clientes", "cpf CHAR(11)"));
    expect(s.find((x) => x.tecnica === "mascaramento")!.dica).toMatch(/\*\*\*\.123\.456-\*\*/);
    expect(tecnicas(col("clientes", "cpf CHAR(11)"))).toEqual(expect.arrayContaining(["criptografia_repouso", "hash_com_sal"]));
  });

  it("sensível: criptografia e pseudonimização, como a ANPD sugere", () => {
    expect(tecnicas(col("pacientes", "diagnostico TEXT"))).toEqual(expect.arrayContaining(["criptografia_repouso", "pseudonimizacao"]));
  });

  it("cartão: tokenização e nunca guardar o CVV", () => {
    const s = sugerirProtecao(col("pagamentos", "cvv CHAR(3)"));
    expect(s.map((x) => x.tecnica)).toContain("tokenizacao");
    expect(s.find((x) => x.tecnica === "tokenizacao")!.dica).toMatch(/Nunca guarde o CVV/);
  });

  it("IP e coordenadas: truncar ou arredondar", () => {
    expect(sugerirProtecao(col("logs", "ip VARCHAR(45)")).find((x) => x.tecnica === "mascaramento")!.dica).toMatch(/último trecho/);
    expect(sugerirProtecao(col("clientes", "latitude DECIMAL(9,6)")).find((x) => x.tecnica === "mascaramento")!.dica).toMatch(/Arredonde/);
  });

  it("nome: pseudonimizar em base de teste; data de nascimento: mostrar só a idade", () => {
    expect(tecnicas(col("clientes", "nome VARCHAR(50)"))).toContain("pseudonimizacao");
    expect(sugerirProtecao(col("clientes", "data_nascimento DATE")).find((x) => x.tecnica === "mascaramento")!.dica).toMatch(/idade/);
  });

  it("criança: criptografia e cuidado redobrado", () => {
    expect(sugerirProtecao(col("alunos", "nome_responsavel VARCHAR(80)")).map((x) => x.tecnica)).toContain("criptografia_repouso");
  });

  it("financeiro comum (saldo) recebe criptografia em repouso", () => {
    expect(tecnicas(col("contas", "saldo DECIMAL(10,2)"))).toContain("criptografia_repouso");
  });

  it("toda técnica citada existe no dicionário", () => {
    for (const [t, d] of [["clientes", "cpf CHAR(11)"], ["pacientes", "diagnostico TEXT"]] as const) {
      for (const s of sugerirProtecao(col(t, d))) expect(TECNICAS[s.tecnica]).toBeDefined();
    }
  });
});
