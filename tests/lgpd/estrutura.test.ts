import { describe, expect, it } from "vitest";
import { analisarDdl } from "../../lib/lgpd/analyze";
import { REGRAS } from "../../lib/lgpd/rules/pt-br";
import { colunasSemClassificacao, gerarRelatorio, resumir, rotuloCategoria } from "../../lib/lgpd/report";
import { paraCsv, paraMarkdown } from "../../lib/lgpd/export";

const colunas = (ddl: string) => analisarDdl(ddl).analise.tabelas.flatMap((t) => t.colunas);
const col = (ddl: string, tabela: string, nome: string) => {
  const c = colunas(ddl).find((x) => x.tabela === tabela && x.coluna === nome);
  if (!c) throw new Error(`coluna ${tabela}.${nome} não encontrada`);
  return c;
};
const achados = (ddl: string) => analisarDdl(ddl).analise.achados.map((a) => `${a.id}:${a.tabela}${a.coluna ? "." + a.coluna : ""}`);

describe("regra 'nome' só vale quando nenhuma regra mais específica casa", () => {
  it("nm_cidade é localização, não nome de pessoa", () => {
    const c = col("CREATE TABLE pacientes (nm_paciente VARCHAR(80), nm_cidade VARCHAR(60), cpf CHAR(11));", "pacientes", "nm_cidade");
    expect(c.categoria).toBe("localizacao");
    expect(col("CREATE TABLE pacientes (nm_paciente VARCHAR(80), cpf CHAR(11));", "pacientes", "nm_paciente").categoria).toBe("identificador_direto");
  });

  it("vale para qualquer nome_*: produto, empresa, categoria, estado, país", () => {
    for (const nome of ["nm_produto", "nome_empresa", "nome_categoria", "nome_estado", "nome_pais", "product_name", "company_name"]) {
      const c = col(`CREATE TABLE clientes (${nome} VARCHAR(80), cpf CHAR(11));`, "clientes", nome);
      expect(c.pessoal, nome).toBe("nao");
    }
  });

  it("nome_responsavel continua sendo indício de criança, e nome_mae continua sendo nome", () => {
    expect(col("CREATE TABLE alunos (nome_responsavel VARCHAR(80));", "alunos", "nome_responsavel").categoria).toBe("crianca_adolescente");
    expect(col("CREATE TABLE alunos (nome_mae VARCHAR(80));", "alunos", "nome_mae").categoria).toBe("identificador_direto");
  });

  it("a regra genérica continua valendo quando é a única que casa", () => {
    const c = col("CREATE TABLE clientes (contact_name VARCHAR(80));", "clientes", "contact_name");
    expect(c.categoria).toBe("identificador_direto");
  });

  it("a regra está marcada como fraca nos dados", () => {
    expect(REGRAS.find((r) => r.id === "idd.nome")?.fraca).toBe(true);
  });
});

describe("FK declarada separa chave de dado (estrutura, não nome)", () => {
  const consulta = (cdCid: string) => `CREATE TABLE tb_consulta (cd_consulta INT, cd_paciente INT, ${cdCid}, dt_cadastro DATETIME${cdCid.includes("REFERENCES") ? ", FOREIGN KEY (cd_cid) REFERENCES tb_cid(cd)" : ""});`;

  it("cd_cid SEM FK, em tabela de saúde, é dado de saúde", () => {
    const c = col(consulta("cd_cid VARCHAR(8)"), "tb_consulta", "cd_cid");
    expect(c).toMatchObject({ categoria: "sensivel", subtipo: "saude" });
  });

  it("cd_cid COM FK declarada para uma tabela é chave", () => {
    const ddl = "CREATE TABLE tb_cid (cd VARCHAR(8) PRIMARY KEY); CREATE TABLE tb_consulta (cd_consulta INT, cd_cid VARCHAR(8), FOREIGN KEY (cd_cid) REFERENCES tb_cid(cd));";
    const c = col(ddl, "tb_consulta", "cd_cid");
    expect(c.categoria).toBe("nao_identificado");
    expect(c.motivo).toMatch(/chave estrangeira declarada/);
    expect(c.ruleId).toBe("nid.fk");
  });

  it("diagnostico_id e cd_paciente continuam sendo chave, com ou sem FK", () => {
    const ddl = "CREATE TABLE tb_consulta (cd_consulta INT, cd_paciente INT, diagnostico_id INT);";
    expect(col(ddl, "tb_consulta", "diagnostico_id").categoria).toBe("nao_identificado");
    expect(col(ddl, "tb_consulta", "cd_paciente").categoria).toBe("nao_identificado");
  });

  it("FK para tabela de catálogo pesa mais e é dita no motivo", () => {
    const ddl = `CREATE TABLE bancos_ref (codigo CHAR(3) PRIMARY KEY, nome VARCHAR(40));
      CREATE TABLE contas (id INT PRIMARY KEY, banco_codigo CHAR(3), cpf CHAR(11), FOREIGN KEY (banco_codigo) REFERENCES bancos_ref(codigo));`;
    const c = col(ddl, "contas", "banco_codigo");
    expect(c.categoria).toBe("nao_identificado");
    expect(c.motivo).toMatch(/tabela de catálogo/);
  });

  it("FK inline (REFERENCES na coluna) também conta", () => {
    const ddl = "CREATE TABLE bancos_ref (codigo CHAR(3)); CREATE TABLE contas (cpf CHAR(11), cd_banco CHAR(3) REFERENCES bancos_ref(codigo));";
    expect(col(ddl, "contas", "cd_banco").ruleId).toBe("nid.fk");
  });
});

describe("contexto da tabela: coluna de nome comum em tabela com identificador de pessoa", () => {
  const DDL = `CREATE TABLE funcionarios (
    id INT PRIMARY KEY, nome VARCHAR(80), cpf CHAR(11), apelido_interno VARCHAR(40),
    hobby VARCHAR(40), senha_hash CHAR(60), ativo TINYINT(1), status VARCHAR(10),
    criado_em DATETIME, atualizado_em DATETIME, departamento_id INT, FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
  );
  CREATE TABLE departamentos (id INT PRIMARY KEY, nome VARCHAR(40), sigla VARCHAR(5));`;

  it("vira 'outro dado pessoal' com confiança BAIXA, 'depende' e motivo 'contexto da tabela'", () => {
    const c = col(DDL, "funcionarios", "hobby");
    expect(c).toMatchObject({ categoria: "outro_dado_pessoal", confianca: "baixa", pessoal: "depende", ruleId: "out.contexto_da_tabela" });
    expect(c.motivo).toMatch(/^contexto da tabela/);
    expect(c.fontes).toContain("LGPD-5-I");
    expect(c.nota).toMatch(/art\. 5º, I/);
  });

  it("não atinge chave, credencial, estado, booleano, data de sistema nem FK", () => {
    for (const n of ["id", "senha_hash", "ativo", "status", "criado_em", "atualizado_em", "departamento_id"]) {
      expect(col(DDL, "funcionarios", n).ruleId, n).not.toBe("out.contexto_da_tabela");
    }
  });

  it("não atinge tabela sem identificador direto de pessoa, nem tabela de catálogo", () => {
    expect(col(DDL, "departamentos", "sigla").categoria).toBe("nao_identificado");
    expect(col("CREATE TABLE pedidos (id INT, total DECIMAL(10,2), obs_interna VARCHAR(40));", "pedidos", "obs_interna").ruleId).toBeNull();
  });

  it("corrigir à mão sobrepõe a suposição", () => {
    const { analise } = analisarDdl(DDL, { "funcionarios.hobby": { categoria: "nao_identificado" } });
    const c = analise.tabelas[0]!.colunas.find((x) => x.coluna === "hobby")!;
    expect(c).toMatchObject({ categoria: "nao_identificado", origem: "manual" });
  });
});

describe("SEM_CICLO_DE_VIDA mais restrito", () => {
  it("ainda aparece para dado pessoal de confiança média ou alta", () => {
    expect(achados("CREATE TABLE clientes (id INT, nome VARCHAR(50), cpf CHAR(11));")).toContain("SEM_CICLO_DE_VIDA:clientes");
  });

  it("não aparece quando o único 'dado pessoal' é suposição de baixa confiança", () => {
    expect(achados("CREATE TABLE sistema_x (id INT, nome VARCHAR(50));")).not.toContain("SEM_CICLO_DE_VIDA:sistema_x");
  });

  it("não aparece em tabela de ligação (PK composta só de FKs)", () => {
    const ddl = `CREATE TABLE clientes (id INT PRIMARY KEY, cpf CHAR(11), criado_em DATETIME);
      CREATE TABLE grupos (id INT PRIMARY KEY, criado_em DATETIME);
      CREATE TABLE cliente_grupo (cliente_id INT, grupo_id INT, cpf_indicador CHAR(11), PRIMARY KEY (cliente_id, grupo_id),
        FOREIGN KEY (cliente_id) REFERENCES clientes(id), FOREIGN KEY (grupo_id) REFERENCES grupos(id));`;
    expect(achados(ddl)).not.toContain("SEM_CICLO_DE_VIDA:cliente_grupo");
  });

  it("não aparece em tabela de catálogo", () => {
    expect(achados("CREATE TABLE cidades (id INT, nome VARCHAR(50), email VARCHAR(50));")).not.toContain("SEM_CICLO_DE_VIDA:cidades");
  });

  it("entende create_date e registered como data de criação", () => {
    expect(achados("CREATE TABLE clientes (nome VARCHAR(50), cpf CHAR(11), create_date DATETIME);")).not.toContain("SEM_CICLO_DE_VIDA:clientes");
    expect(achados("CREATE TABLE users (user_email VARCHAR(50), registered DATETIME);")).not.toContain("SEM_CICLO_DE_VIDA:users");
  });
});

describe("INDICIO_MENOR soma data de nascimento em escola ou cadastro de responsável", () => {
  it("nascimento em tabela de escola", () => {
    expect(achados("CREATE TABLE escola_cadastro (nome VARCHAR(80), nascimento DATE, criado_em DATETIME);")).toContain("INDICIO_MENOR:escola_cadastro");
  });
  it("nascimento em tabela de responsável", () => {
    expect(achados("CREATE TABLE responsaveis (nome VARCHAR(80), data_nascimento DATE, criado_em DATETIME);")).toContain("INDICIO_MENOR:responsaveis");
  });
  it("nascimento em cadastro comum não soma indício", () => {
    expect(achados("CREATE TABLE clientes (nome VARCHAR(80), data_nascimento DATE, criado_em DATETIME);")).not.toContain("INDICIO_MENOR:clientes");
  });
});

describe("notas de foto e gênero", () => {
  it("foto é dado pessoal comum; biometria só com indício de uso para identificar", () => {
    const foto = col("CREATE TABLE clientes (foto_url VARCHAR(200));", "clientes", "foto_url");
    expect(foto).toMatchObject({ categoria: "outro_dado_pessoal", sensivel: false });
    expect(foto.nota).toMatch(/dado pessoal comum/);
    expect(foto.nota).toMatch(/reconhecimento facial/);
    const bio = col("CREATE TABLE clientes (foto_url VARCHAR(200) COMMENT 'Selfie para reconhecimento facial');", "clientes", "foto_url");
    expect(bio).toMatchObject({ categoria: "sensivel", subtipo: "biometrico" });
  });

  it("gênero é dado pessoal, com nota de que orientação e vida sexual são sensíveis", () => {
    const g = col("CREATE TABLE clientes (genero VARCHAR(20));", "clientes", "genero");
    expect(g).toMatchObject({ categoria: "outro_dado_pessoal", sensivel: false });
    expect(g.nota).toMatch(/orientação sexual e vida sexual são sensíveis/);
  });
});

describe("'não identificado' diz que é das regras", () => {
  it("rótulo de tela e relatório", () => {
    expect(rotuloCategoria("nao_identificado")).toBe("Não identificado pelas regras");
    expect(rotuloCategoria("sensivel")).toBe("Sensível");
  });

  it("lista as colunas sem nenhuma regra, para o usuário revisar", () => {
    const { analise } = analisarDdl("CREATE TABLE produtos (id INT, campo1 VARCHAR(20), cor VARCHAR(10));");
    expect(colunasSemClassificacao(analise).map((c) => c.coluna)).toEqual(["campo1", "cor"]);
  });

  it("a revisão ignora chave, data de sistema, credencial, estado e booleano", () => {
    const { analise } = analisarDdl("CREATE TABLE produtos (id INT, criado_em DATETIME, senha_hash CHAR(60), ativo TINYINT(1), status VARCHAR(5), campo1 VARCHAR(20));");
    expect(colunasSemClassificacao(analise).map((c) => c.coluna)).toEqual(["campo1"]);
    const r = gerarRelatorio(analise);
    expect(resumir(r).semClassificacao).toBe(1);
  });

  it("relatório em Markdown e CSV usa o rótulo e avisa para revisar", () => {
    const r = gerarRelatorio(analisarDdl("CREATE TABLE produtos (id INT, campo1 VARCHAR(20));").analise);
    expect(paraMarkdown(r)).toMatch(/Não identificado pelas regras/);
    expect(paraMarkdown(r)).toMatch(/revise, isso quer dizer que a Tarja não achou pista/);
    expect(paraCsv(r)).toMatch(/Não identificado pelas regras/);
    expect(resumir(r).semClassificacao).toBe(1);
  });
});
