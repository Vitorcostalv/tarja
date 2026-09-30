import { describe, expect, it } from "vitest";
import { analisarDdl } from "../../lib/lgpd/analyze";
import type { ClassificacaoColuna } from "../../lib/lgpd/types";

/** Classifica uma coluna dentro de uma tabela e devolve só ela. */
function classificar(tabela: string, definicao: string): ClassificacaoColuna {
  const { analise } = analisarDdl(`CREATE TABLE ${tabela} (${definicao});`);
  return analise.tabelas[0]!.colunas[0]!;
}

describe("classificador: identificadores diretos", () => {
  it("CPF: dado pessoal, NÃO sensível, com confiança alta e motivo legível", () => {
    const c = classificar("clientes", "cpf VARCHAR(14)");
    expect(c).toMatchObject({ categoria: "identificador_direto", pessoal: "sim", sensivel: false, confianca: "alta" });
    expect(c.motivo).toMatch(/CPF/);
    expect(c.motivo).toMatch(/VARCHAR\(14\)/);
    expect(c.nota).toMatch(/NÃO é dado sensível/);
    expect(c.fontes).toContain("LGPD-5-I");
  });

  it("RG e CNH: pessoais e não sensíveis", () => {
    for (const col of ["rg VARCHAR(12)", "cnh VARCHAR(11)"]) {
      expect(classificar("clientes", col)).toMatchObject({ categoria: "identificador_direto", sensivel: false, pessoal: "sim" });
    }
  });

  it("CNPJ: 'depende', com nota sobre empresário individual e sócio", () => {
    const c = classificar("fornecedores", "cnpj CHAR(14)");
    expect(c.pessoal).toBe("depende");
    expect(c.sensivel).toBe(false);
    expect(c.nota).toMatch(/empresário individual/);
  });

  it("campo 'CPF ou CNPJ' também é 'depende'", () => {
    expect(classificar("clientes", "cpf_cnpj VARCHAR(18)").pessoal).toBe("depende");
    expect(classificar("clientes", "doc VARCHAR(18) COMMENT 'CPF ou CNPJ do cliente'").pessoal).toBe("depende");
  });

  it("e-mail e telefone", () => {
    expect(classificar("usuarios", "email VARCHAR(120)")).toMatchObject({ categoria: "identificador_direto", confianca: "alta" });
    expect(classificar("usuarios", "telefone VARCHAR(20)").categoria).toBe("identificador_direto");
  });
});

describe("classificador: o contexto da tabela decide", () => {
  it("produtos.nome não é dado pessoal, clientes.nome é", () => {
    expect(classificar("produtos", "nome VARCHAR(100)")).toMatchObject({ categoria: "nao_identificado", pessoal: "nao" });
    const c = classificar("clientes", "nome VARCHAR(100)");
    expect(c).toMatchObject({ categoria: "identificador_direto", pessoal: "sim" });
    expect(c.motivo).toMatch(/clientes/);
  });

  it("tabela de pessoas mesmo sem nome óbvio: CPF + e-mail + nome", () => {
    const { analise } = analisarDdl("CREATE TABLE cadastro_x (nome VARCHAR(80), cpf CHAR(11), email VARCHAR(80));");
    expect(analise.tabelas[0]!.contexto).toBe("pessoa");
    expect(analise.tabelas[0]!.colunas[0]!.confianca).toBe("alta");
  });

  it("endereço de loja não é dado pessoal; endereço de cliente é", () => {
    expect(classificar("lojas", "endereco VARCHAR(200)").pessoal).toBe("nao");
    expect(classificar("clientes", "endereco VARCHAR(200)").categoria).toBe("localizacao");
  });

  it("cidade, número e estado só contam numa tabela de endereços", () => {
    expect(classificar("enderecos", "numero VARCHAR(10)").categoria).toBe("localizacao");
    expect(classificar("enderecos", "estado CHAR(2)").categoria).toBe("localizacao");
    expect(classificar("pedidos", "numero INT").categoria).toBe("nao_identificado");
    expect(classificar("pedidos", "estado VARCHAR(10)").categoria).toBe("nao_identificado");
  });

  it("e-mail corporativo de parceiro não é dado pessoal", () => {
    expect(classificar("parceiros", "email_comercial VARCHAR(100)").pessoal).toBe("nao");
  });

  it("razão social e nome fantasia são de pessoa jurídica", () => {
    expect(classificar("clientes", "razao_social VARCHAR(100)")).toMatchObject({ categoria: "nao_identificado", pessoal: "nao" });
    expect(classificar("clientes", "nome_fantasia VARCHAR(100)").pessoal).toBe("nao");
  });

  it("COMMENT da tabela 'pessoa jurídica' desliga o nome", () => {
    const { analise } = analisarDdl("CREATE TABLE contas_x (nome VARCHAR(80)) COMMENT='Dados de pessoa jurídica';");
    expect(analise.tabelas[0]!.colunas[0]!.pessoal).toBe("nao");
  });
});

describe("classificador: abreviações e idiomas", () => {
  const casos: Array<[string, string, string]> = [
    ["dt_nasc DATE", "outro_dado_pessoal", "abreviação de nascimento"],
    ["birth_date DATE", "outro_dado_pessoal", "inglês"],
    ["DataNascimento DATE", "outro_dado_pessoal", "PascalCase"],
    ["nm_cliente VARCHAR(80)", "identificador_direto", "nm_ vira nome"],
    ["nr_cpf VARCHAR(11)", "identificador_direto", "nr_ vira número"],
    ["tel VARCHAR(15)", "identificador_direto", "tel"],
    ["fone VARCHAR(15)", "identificador_direto", "fone"],
    ["phone VARCHAR(15)", "identificador_direto", "phone"],
    ["celular VARCHAR(15)", "identificador_direto", "celular"],
    ["e_mail VARCHAR(80)", "identificador_direto", "e_mail"],
    ["dsEmail VARCHAR(80)", "identificador_direto", "prefixo ds"],
    ["zip_code VARCHAR(10)", "localizacao", "zip"],
    ["end_cob VARCHAR(100)", "localizacao", "end_ vira endereço"],
    ["latitude DECIMAL(9,6)", "localizacao", "latitude"],
    ["ip_address VARCHAR(45)", "localizacao", "ip"],
  ];
  for (const [def, esperado, nome] of casos) {
    it(`${nome}: ${def} -> ${esperado}`, () => {
      expect(classificar("clientes", def).categoria).toBe(esperado);
    });
  }

  it("'end_date' não vira endereço", () => {
    expect(classificar("clientes", "end_date DATE").categoria).toBe("nao_identificado");
  });

  it("COMMENT ajuda quando o nome não diz nada", () => {
    const c = classificar("cad_cliente", "campo1 VARCHAR(20) COMMENT 'Telefone principal'");
    expect(c.categoria).toBe("identificador_direto");
    expect(c.motivo).toMatch(/COMMENT/);
  });

  it("chaves e FKs não são dado pessoal", () => {
    for (const d of ["id INT", "cliente_id INT", "id_cliente INT", "cd_paciente INT", "cpf_id INT"]) {
      expect(classificar("pedidos", d).pessoal).toBe("nao");
    }
  });
});

describe("classificador: sensível (lista fechada do art. 5º, II)", () => {
  const sensiveis: Array<[string, string]> = [
    ["cor_raca VARCHAR(20)", "racial_etnica"],
    ["religiao VARCHAR(30)", "religiao"],
    ["orientacao_politica VARCHAR(30)", "politica"],
    ["filiado_sindicato TINYINT(1)", "sindical"],
    ["diagnostico TEXT", "saude"],
    ["cid10 VARCHAR(8)", "saude"],
    ["tipo_sanguineo VARCHAR(3)", "saude"],
    ["orientacao_sexual VARCHAR(20)", "vida_sexual"],
    ["resultado_dna LONGTEXT", "genetico"],
    ["biometria_facial BLOB", "biometrico"],
  ];
  for (const [def, subtipo] of sensiveis) {
    it(`${def} é sensível (${subtipo})`, () => {
      const c = classificar("pacientes", def);
      expect(c).toMatchObject({ categoria: "sensivel", subtipo, sensivel: true, pessoal: "sim" });
      expect(c.fontes).toContain("LGPD-5-II");
    });
  }

  it("sexo/gênero NÃO é vida sexual", () => {
    const c = classificar("clientes", "sexo CHAR(1)");
    expect(c.categoria).toBe("outro_dado_pessoal");
    expect(c.sensivel).toBe(false);
  });

  it("nada que a lei não lista vira sensível: CPF, RG, e-mail, endereço, financeiro", () => {
    for (const d of ["cpf CHAR(11)", "rg VARCHAR(12)", "email VARCHAR(80)", "endereco VARCHAR(80)", "salario DECIMAL(10,2)", "cartao_numero VARCHAR(19)"]) {
      expect(classificar("funcionarios", d).sensivel, d).toBe(false);
    }
  });

  it("proteção aparente: hash, token e tipo binário", () => {
    expect(classificar("pacientes", "diagnostico_hash CHAR(64)").protecaoAparente).toBe(true);
    expect(classificar("pacientes", "diagnostico BLOB").protecaoAparente).toBe(true);
    expect(classificar("pacientes", "diagnostico TEXT").protecaoAparente).toBe(false);
  });
});

describe("classificador: financeiro, criança, outros", () => {
  it("financeiro: não é sensível, mas é de alto risco", () => {
    const c = classificar("contas", "saldo DECIMAL(12,2)");
    expect(c).toMatchObject({ categoria: "financeiro", sensivel: false, altoRisco: true, pessoal: "sim" });
    expect(c.nota).toMatch(/alto risco/);
  });

  it("cartão, CVV e chave Pix são financeiros", () => {
    for (const d of ["cartao_numero VARCHAR(19)", "cvv CHAR(3)", "chave_pix VARCHAR(140)"]) {
      expect(classificar("pagamentos", d).categoria, d).toBe("financeiro");
    }
  });

  it("valor só é financeiro em tabela de movimentação; em pedido é valor comercial", () => {
    expect(classificar("transacoes", "valor DECIMAL(10,2)").categoria).toBe("financeiro");
    expect(classificar("pedidos", "valor_total DECIMAL(10,2)").categoria).toBe("nao_identificado");
    expect(classificar("produtos", "preco DECIMAL(10,2)").categoria).toBe("nao_identificado");
  });

  it("indícios de criança e adolescente", () => {
    expect(classificar("alunos", "nome_responsavel VARCHAR(100)").categoria).toBe("crianca_adolescente");
    expect(classificar("usuarios", "menor_de_idade TINYINT(1)").categoria).toBe("crianca_adolescente");
    expect(classificar("usuarios", "responsavel_legal_id INT").categoria).toBe("crianca_adolescente");
  });

  it("'responsavel_financeiro' na própria tabela de responsáveis não é indício de menor", () => {
    expect(classificar("responsaveis", "responsavel_financeiro TINYINT(1)").categoria).toBe("nao_identificado");
  });

  it("nenhuma coluna fica sem classificação, nem a sem sinal", () => {
    const c = classificar("qualquer", "zzz INT");
    expect(c).toMatchObject({ categoria: "nao_identificado", pessoal: "nao", confianca: "baixa", ruleId: null });
    expect(c.motivo.length).toBeGreaterThan(10);
  });
});

describe("classificador: correção manual", () => {
  it("entra na análise com origem 'manual' e recalcula sensível", () => {
    const ddl = "CREATE TABLE pacientes (observacao TEXT);";
    const { analise } = analisarDdl(ddl, { "pacientes.observacao": { categoria: "sensivel", subtipo: "saude" } });
    const c = analise.tabelas[0]!.colunas[0]!;
    expect(c).toMatchObject({ origem: "manual", categoria: "sensivel", subtipo: "saude", sensivel: true, pessoal: "sim", confianca: "alta" });
    expect(c.motivo).toMatch(/corrigido à mão/);
  });

  it("corrigir para 'não identificado' tira o pessoal e os achados dependentes", () => {
    const ddl = "CREATE TABLE pacientes (diagnostico TEXT, criado_em DATETIME);";
    const base = analisarDdl(ddl).analise;
    expect(base.achados.some((a) => a.id === "SENSIVEL_SEM_PROTECAO")).toBe(true);
    const corrigida = analisarDdl(ddl, { "pacientes.diagnostico": { categoria: "nao_identificado" } }).analise;
    expect(corrigida.achados.some((a) => a.id === "SENSIVEL_SEM_PROTECAO")).toBe(false);
    expect(corrigida.tabelas[0]!.colunas[0]!.pessoal).toBe("nao");
  });
});
