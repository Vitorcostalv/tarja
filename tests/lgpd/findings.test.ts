import { describe, expect, it } from "vitest";
import { analisarDdl } from "../../lib/lgpd/analyze";

const achados = (ddl: string) => analisarDdl(ddl).analise.achados;
const ids = (ddl: string) => achados(ddl).map((a) => a.id);

describe("achado SEM_CICLO_DE_VIDA", () => {
  it("dado pessoal sem data de criação nem exclusão lógica", () => {
    expect(ids("CREATE TABLE clientes (id INT, nome VARCHAR(50), cpf CHAR(11));")).toContain("SEM_CICLO_DE_VIDA");
  });
  it("não aparece com data de criação", () => {
    expect(ids("CREATE TABLE clientes (id INT, nome VARCHAR(50), criado_em DATETIME);")).not.toContain("SEM_CICLO_DE_VIDA");
    expect(ids("CREATE TABLE clientes (id INT, nome VARCHAR(50), created_at DATETIME);")).not.toContain("SEM_CICLO_DE_VIDA");
  });
  it("não aparece com exclusão lógica", () => {
    expect(ids("CREATE TABLE clientes (id INT, nome VARCHAR(50), deleted_at DATETIME);")).not.toContain("SEM_CICLO_DE_VIDA");
    expect(ids("CREATE TABLE clientes (id INT, nome VARCHAR(50), excluido TINYINT);")).not.toContain("SEM_CICLO_DE_VIDA");
  });
  it("um booleano 'ativo' NÃO conta como exclusão lógica", () => {
    expect(ids("CREATE TABLE clientes (id INT, nome VARCHAR(50), ativo TINYINT(1));")).toContain("SEM_CICLO_DE_VIDA");
  });
  it("não aparece em tabela sem dado pessoal", () => {
    expect(ids("CREATE TABLE produtos (id INT, nome VARCHAR(50), preco DECIMAL(10,2));")).toEqual([]);
  });
  it("em tabela de log, qualquer coluna de data serve", () => {
    expect(ids("CREATE TABLE log_acesso (id INT, ip VARCHAR(45), dt_evento DATETIME);")).not.toContain("SEM_CICLO_DE_VIDA");
  });
  it("tem gravidade, explicação e fonte, e é só informativo (a precisão medida foi de 57%)", () => {
    const a = achados("CREATE TABLE clientes (nome VARCHAR(50), cpf CHAR(11));").find((x) => x.id === "SEM_CICLO_DE_VIDA")!;
    expect(a.explicacao.length).toBeGreaterThan(40);
    expect(a.fontes).toEqual(expect.arrayContaining(["LGPD-16"]));
    expect(a.gravidade).toBe("informativo");
    expect(a.titulo).toMatch(/^Informativo:/);
  });
});

describe("achado TEXTO_LIVRE", () => {
  it("campo de texto livre numa tabela com dado pessoal", () => {
    const a = achados("CREATE TABLE clientes (nome VARCHAR(50), observacao TEXT, criado_em DATETIME);");
    expect(a.find((x) => x.id === "TEXTO_LIVRE")).toMatchObject({ tabela: "clientes", coluna: "observacao" });
  });
  it("não aparece se o tipo não é TEXT (VARCHAR curto)", () => {
    expect(ids("CREATE TABLE clientes (nome VARCHAR(50), observacao VARCHAR(100), criado_em DATETIME);")).not.toContain("TEXTO_LIVRE");
  });
  it("não aparece se o nome não é de texto livre", () => {
    expect(ids("CREATE TABLE clientes (nome VARCHAR(50), bio_extra TEXT, criado_em DATETIME);")).not.toContain("TEXTO_LIVRE");
  });
  it("não aparece em tabela sem outro dado pessoal", () => {
    expect(ids("CREATE TABLE produtos (nome VARCHAR(50), descricao TEXT, criado_em DATETIME);")).not.toContain("TEXTO_LIVRE");
  });
});

describe("achado SENSIVEL_SEM_PROTECAO", () => {
  it("dado sensível sem hash nem tipo binário", () => {
    const a = achados("CREATE TABLE pacientes (diagnostico TEXT, criado_em DATETIME);");
    expect(a.find((x) => x.id === "SENSIVEL_SEM_PROTECAO")).toMatchObject({ coluna: "diagnostico", gravidade: "alta" });
  });
  it("some com indício de proteção", () => {
    expect(ids("CREATE TABLE pacientes (diagnostico_criptografado BLOB, criado_em DATETIME);")).not.toContain("SENSIVEL_SEM_PROTECAO");
    expect(ids("CREATE TABLE pacientes (diagnostico VARBINARY(255), criado_em DATETIME);")).not.toContain("SENSIVEL_SEM_PROTECAO");
  });
  it("a explicação é honesta: é indício, não prova", () => {
    const a = achados("CREATE TABLE pacientes (diagnostico TEXT, criado_em DATETIME);").find((x) => x.id === "SENSIVEL_SEM_PROTECAO")!;
    expect(a.explicacao).toMatch(/indício, não uma prova/);
  });
  it("CPF (pessoal, não sensível) não dispara", () => {
    expect(ids("CREATE TABLE clientes (cpf CHAR(11), criado_em DATETIME);")).not.toContain("SENSIVEL_SEM_PROTECAO");
  });
});

describe("achado PESSOAL_EM_LOG", () => {
  it("IP em tabela de log", () => {
    expect(ids("CREATE TABLE logs_acesso (id INT, ip VARCHAR(45), criado_em DATETIME);")).toContain("PESSOAL_EM_LOG");
    expect(ids("CREATE TABLE auditoria (id INT, usuario_email VARCHAR(80), quando DATETIME);")).toContain("PESSOAL_EM_LOG");
    expect(ids("CREATE TABLE historico_login (id INT, ip VARCHAR(45), criado_em DATETIME);")).toContain("PESSOAL_EM_LOG");
  });
  it("log sem dado pessoal não dispara", () => {
    expect(ids("CREATE TABLE logs_jobs (id INT, status VARCHAR(10), criado_em DATETIME);")).not.toContain("PESSOAL_EM_LOG");
  });
  it("IP fora de tabela de log não dispara", () => {
    expect(ids("CREATE TABLE sessoes (id INT, ip VARCHAR(45), criado_em DATETIME);")).not.toContain("PESSOAL_EM_LOG");
  });
});

describe("achado INDICIO_MENOR", () => {
  it("coluna de responsável legal", () => {
    expect(ids("CREATE TABLE pacientes (nome_responsavel VARCHAR(80), criado_em DATETIME);")).toContain("INDICIO_MENOR");
  });
  it("tabela de alunos", () => {
    expect(ids("CREATE TABLE alunos (nome VARCHAR(80), criado_em DATETIME);")).toContain("INDICIO_MENOR");
  });
  it("a explicação cita o consentimento de um dos pais e diz que é só indício", () => {
    const a = achados("CREATE TABLE alunos (nome VARCHAR(80), criado_em DATETIME);").find((x) => x.id === "INDICIO_MENOR")!;
    expect(a.explicacao).toMatch(/pelo menos um dos pais/);
    expect(a.explicacao).toMatch(/indício/);
    expect(a.fontes).toContain("LGPD-14");
  });
  it("clientes comuns não disparam", () => {
    expect(ids("CREATE TABLE clientes (nome VARCHAR(80), criado_em DATETIME);")).not.toContain("INDICIO_MENOR");
  });
});

describe("achados: ordem estável", () => {
  it("mais graves primeiro, depois por id, tabela e coluna", () => {
    const a = achados(`
      CREATE TABLE pacientes (diagnostico TEXT, alergia TEXT, nome VARCHAR(50));
      CREATE TABLE clientes (nome VARCHAR(50));`);
    const ordem = { alta: 0, media: 1, baixa: 2, informativo: 3 };
    for (let i = 1; i < a.length; i++) {
      expect(ordem[a[i - 1]!.gravidade]).toBeLessThanOrEqual(ordem[a[i]!.gravidade]);
    }
  });
});
