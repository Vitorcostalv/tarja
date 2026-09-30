import { describe, expect, it } from "vitest";
import { CATALOGO, regraPorId } from "../../lib/ddl/catalogo";
import { verificarPadroes, type OpcoesPadroes, type Violacao } from "../../lib/ddl/verificar";

const OPC: OpcoesPadroes = { modo: "auto", extensoes: "" };
const ids = (r: { violacoes: Violacao[] }) => r.violacoes.map((v) => v.regra);
const rodar = (ddl: string, o: Partial<OpcoesPadroes> = {}) => verificarPadroes(ddl, { ...OPC, ...o });
const tem = (ddl: string, id: string, o: Partial<OpcoesPadroes> = {}) => ids(rodar(ddl, o)).includes(id);
const sev = (ddl: string, id: string, o: Partial<OpcoesPadroes> = {}) => rodar(ddl, o).violacoes.find((v) => v.regra === id)?.severidade;

const TS = "ts_alteracao timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP";
const CONFORME = `CREATE TABLE app_crm.tb_cliente (
  cod_cliente int(11) NOT NULL AUTO_INCREMENT,
  cod_projeto int(11) NOT NULL,
  cod_grupo int(11) NOT NULL,
  nm_cliente varchar(100) NOT NULL DEFAULT '',
  tx_descricao varchar(255) NOT NULL DEFAULT '',
  dt_criacao datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  vl_limite decimal(12,2) NOT NULL DEFAULT '0.00',
  dt_baixa datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  hr_corte time NOT NULL DEFAULT '00:00:00',
  en_ativo enum('Sim','Nao') NOT NULL DEFAULT 'Sim',
  ${TS},
  PRIMARY KEY (cod_cliente),
  KEY i_projeto_grupo (cod_projeto, cod_grupo),
  UNIQUE KEY i_projeto_nome (cod_projeto, nm_cliente)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;`;

/** Substitui uma linha da tabela conforme. */
const mudar = (de: string, para: string) => {
  if (!CONFORME.includes(de)) throw new Error(`trecho não encontrado: ${de}`);
  return CONFORME.replace(de, para);
};

describe("padrões v2: tabela conforme", () => {
  it("não tem nenhuma violação e todas as regras exercidas passam", () => {
    const r = rodar(CONFORME);
    expect(r.violacoes).toEqual([]);
    expect(r.tabelas[0]).toMatchObject({ perfil: "tb", modo: "legada", modoDeduzido: true });
    expect(r.regrasSemViolacao.length).toBe(r.regrasVerificadas.length);
    expect(r.regrasVerificadas.length).toBeGreaterThan(25);
  });
});

describe("padrões v2: §1 estrutura e eixo nova × legada", () => {
  it("E01: nome sem tb_", () => {
    expect(tem(CONFORME.replace("tb_cliente", "cliente"), "E01")).toBe(true);
  });
  it("E02: coluna NULL", () => {
    expect(tem(mudar("nm_cliente varchar(100) NOT NULL DEFAULT ''", "nm_cliente varchar(100) DEFAULT ''"), "E02")).toBe(true);
  });
  it("E03: MyISAM ou sem ENGINE", () => {
    expect(tem(CONFORME.replace("ENGINE=InnoDB", "ENGINE=MyISAM"), "E03")).toBe(true);
    expect(tem(CONFORME.replace("ENGINE=InnoDB ", ""), "E03")).toBe(true);
  });
  it("E05: AUTO_INCREMENT=x na tabela", () => {
    expect(tem(CONFORME.replace("ENGINE=InnoDB", "ENGINE=InnoDB AUTO_INCREMENT=42"), "E05")).toBe(true);
  });
  it("E06: FOREIGN KEY física", () => {
    expect(tem(mudar("PRIMARY KEY (cod_cliente),", "PRIMARY KEY (cod_cliente), FOREIGN KEY (cod_grupo) REFERENCES app_crm.tb_grupo(cod_grupo),"), "E06")).toBe(true);
  });
  it("E07: primeira coluna fora do padrão", () => {
    expect(tem(mudar("cod_cliente int(11) NOT NULL AUTO_INCREMENT", "id int(11) NOT NULL AUTO_INCREMENT").replace("PRIMARY KEY (cod_cliente)", "PRIMARY KEY (id)"), "E07")).toBe(true);
    expect(tem(mudar("cod_cliente int(11) NOT NULL AUTO_INCREMENT", "cod_cliente int(11) NOT NULL"), "E07")).toBe(true);
  });
  it("E08: falta cod_projeto", () => {
    expect(tem(mudar("cod_projeto int(11) NOT NULL,\n", ""), "E08")).toBe(true);
  });
  it("E09: tx_descricao que não é varchar(255)", () => {
    expect(tem(mudar("tx_descricao varchar(255)", "tx_descricao varchar(100)"), "E09")).toBe(true);
  });
  it("E10: sem dt_criacao, ou com default errado", () => {
    expect(tem(mudar("dt_criacao datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,\n", ""), "E10")).toBe(true);
    expect(tem(mudar("dt_criacao datetime NOT NULL DEFAULT CURRENT_TIMESTAMP", "dt_criacao datetime NOT NULL DEFAULT '0000-00-00 00:00:00'"), "E10")).toBe(true);
  });
  it("E11: ts_alteracao ausente, incompleto ou fora do fim", () => {
    expect(tem(mudar(`${TS},\n`, ""), "E11")).toBe(true);
    expect(tem(mudar(TS, "ts_alteracao timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP"), "E11")).toBe(true);
    expect(tem(mudar(`  ${TS},\n`, "").replace("en_ativo enum('Sim','Nao') NOT NULL DEFAULT 'Sim',", `${TS}, en_ativo enum('Sim','Nao') NOT NULL DEFAULT 'Sim',`), "E11")).toBe(true);
  });

  it("o mesmo item é ERRO em tabela nova e AVISO em tabela legada", () => {
    const semInnoDb = CONFORME.replace("ENGINE=InnoDB", "ENGINE=MyISAM");
    expect(sev(semInnoDb, "E03", { modo: "legada" })).toBe("aviso");
    expect(sev(semInnoDb, "E03", { modo: "nova" })).toBe("erro");
  });

  it("o modo é deduzido do charset: latin1 legada, utf8mb4 nova, e o verificador informa", () => {
    expect(rodar(CONFORME).tabelas[0]).toMatchObject({ modo: "legada", modoDeduzido: true });
    const nova = rodar(CONFORME.replace("latin1", "utf8mb4"));
    expect(nova.tabelas[0]).toMatchObject({ modo: "nova", modoDeduzido: true });
    expect(rodar(CONFORME, { modo: "nova" }).tabelas[0]).toMatchObject({ modo: "nova", modoDeduzido: false });
  });
});

describe("padrões v2: §2 charset e collation", () => {
  it("C01: utf8mb4 destoa (aviso), mas coluna js_ é exceção esperada", () => {
    expect(sev(CONFORME.replace("latin1", "utf8mb4"), "C01")).toBe("aviso");
    const comJson = mudar("PRIMARY KEY (cod_cliente),", "js_dados json NOT NULL, PRIMARY KEY (cod_cliente),").replace("ts_alteracao", "ts_alteracao");
    const json = rodar(comJson.replace("js_dados json NOT NULL,", "js_dados json CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,"));
    expect(ids(json)).not.toContain("C01");
    expect(ids(json)).not.toContain("C02");
  });
  it("C02: collation explícita na tabela e na coluna", () => {
    expect(tem(CONFORME.replace("DEFAULT CHARSET=latin1", "DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci"), "C02")).toBe(true);
    expect(tem(mudar("nm_cliente varchar(100) NOT NULL DEFAULT ''", "nm_cliente varchar(100) COLLATE latin1_bin NOT NULL DEFAULT ''"), "C02")).toBe(true);
  });
});

describe("padrões v2: §3 prefixo × tipo", () => {
  const coluna = (def: string) => mudar("PRIMARY KEY (cod_cliente),", `${def}, PRIMARY KEY (cod_cliente),`);
  const casos: Array<[string, string, string]> = [
    ["cod_x bigint NOT NULL", "P01", "cod_ pede int(11)"],
    ["vl_x double NOT NULL DEFAULT '0.00'", "P01", "vl_ pede decimal(12,2)"],
    ["vl_x decimal(10,2) NOT NULL DEFAULT '0.00'", "P01", "vl_ pede decimal(12,2), não (10,2)"],
    ["nm_x varchar(80) NOT NULL DEFAULT ''", "P01", "nm_ pede 100/150/200/250"],
    ["en_x varchar(3) NOT NULL DEFAULT ''", "P01", "en_ pede enum"],
    ["cpf_x varchar(11) NOT NULL DEFAULT ''", "P01", "cpf_ pede texto(20)"],
    ["cnpj_x char(14) NOT NULL DEFAULT ''", "P01", "cnpj_ pede texto(20)"],
    ["js_x text NOT NULL", "P01", "js_ pede JSON"],
    ["dh_x date NOT NULL DEFAULT '0000-00-00'", "P01", "dh_ pede datetime"],
    ["ts_x datetime NOT NULL DEFAULT '0000-00-00 00:00:00'", "P01", "ts_ pede timestamp"],
    ["hr_x datetime NOT NULL DEFAULT '0000-00-00 00:00:00'", "P01", "hr_ pede time"],
    ["tx_x int NOT NULL", "P01", "tx_ pede texto"],
    ["nu_x varchar(10) NOT NULL DEFAULT ''", "P01", "nu_ pede numérico"],
    ["nu_secs_x varchar(10) NOT NULL DEFAULT ''", "P01", "nu_secs_ pede numérico"],
    ["pc_x varchar(10) NOT NULL DEFAULT ''", "P01", "pc_ pede numérico"],
    ["qt_x varchar(10) NOT NULL DEFAULT ''", "P01", "qt_ pede numérico"],
    ["status enum('Ok','Nok') NOT NULL DEFAULT 'Ok'", "P02", "enum pede en_"],
    ["quando timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP", "P02", "timestamp pede ts_"],
    ["quando time NOT NULL DEFAULT '00:00:00'", "P02", "time pede hr_"],
    ["dt_criacao_x datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, dt_alteracao timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP", "P03", "dt_alteracao timestamp é legado"],
  ];
  for (const [def, id, nome] of casos) {
    it(`${id}: ${nome}`, () => {
      expect(tem(coluna(def), id)).toBe(true);
    });
  }
  const aceitos = [
    "cod_x int(11) NOT NULL", "nu_x bigint NOT NULL DEFAULT '0'", "vl_x decimal(12,2) NOT NULL DEFAULT '0.00'", "pc_x decimal(5,2) NOT NULL DEFAULT '0.00'",
    "qt_x float NOT NULL DEFAULT '0'", "cnpj_x varchar(20) NOT NULL DEFAULT ''", "cpf_x char(20) NOT NULL DEFAULT ''", "nm_x varchar(250) NOT NULL DEFAULT ''",
    "tx_x text NOT NULL", "js_x json NOT NULL", "dt_x date NOT NULL DEFAULT '0000-00-00'", "dh_x datetime NOT NULL DEFAULT '0000-00-00 00:00:00'",
    "ts_x timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP", "hr_x time NOT NULL DEFAULT '00:00:00'", "en_x enum('Sim','Nao') NOT NULL DEFAULT 'Sim'",
  ];
  for (const def of aceitos) {
    it(`aceita ${def}`, () => {
      const v = rodar(coluna(def)).violacoes.filter((x) => ["P01", "P02", "P03"].includes(x.regra));
      expect(v, JSON.stringify(v)).toEqual([]);
    });
  }
});

describe("padrões v2: §4 defaults", () => {
  const coluna = (def: string) => mudar("PRIMARY KEY (cod_cliente),", `${def}, PRIMARY KEY (cod_cliente),`);
  it("D01 varchar NOT NULL sem DEFAULT ''", () => {
    expect(tem(mudar("nm_cliente varchar(100) NOT NULL DEFAULT ''", "nm_cliente varchar(100) NOT NULL"), "D01")).toBe(true);
  });
  it("D02 vl_ sem DEFAULT '0.00'", () => {
    expect(tem(mudar("vl_limite decimal(12,2) NOT NULL DEFAULT '0.00'", "vl_limite decimal(12,2) NOT NULL"), "D02")).toBe(true);
  });
  it("D03 datetime e time sem sentinela", () => {
    expect(tem(mudar("dt_baixa datetime NOT NULL DEFAULT '0000-00-00 00:00:00'", "dt_baixa datetime NOT NULL"), "D03")).toBe(true);
    expect(tem(mudar("hr_corte time NOT NULL DEFAULT '00:00:00'", "hr_corte time NOT NULL"), "D03")).toBe(true);
  });
  it("D04 FK com DEFAULT '0' é aviso", () => {
    const d = coluna("cod_outro int(11) NOT NULL DEFAULT '0'");
    expect(sev(d, "D04")).toBe("aviso");
  });
  it("D05 cod_projeto com qualquer DEFAULT é ERRO, em qualquer modo", () => {
    const d = mudar("cod_projeto int(11) NOT NULL,", "cod_projeto int(11) NOT NULL DEFAULT '0',");
    expect(sev(d, "D05", { modo: "legada" })).toBe("erro");
    expect(sev(d, "D05", { modo: "nova" })).toBe("erro");
  });
  it("FK sem DEFAULT é o padrão e passa", () => {
    expect(ids(rodar(CONFORME))).not.toContain("D04");
  });
  it("aceita DEFAULT com sentinela numérico escrito sem aspas em vl_", () => {
    expect(ids(rodar(mudar("DEFAULT '0.00'", "DEFAULT 0.00")))).not.toContain("D02");
  });
  void coluna;
});

describe("padrões v2: §5 índices", () => {
  it("I01: índice sem i_", () => {
    expect(tem(mudar("KEY i_projeto_grupo", "KEY idx_projeto_grupo"), "I01")).toBe(true);
    expect(tem(mudar("UNIQUE KEY i_projeto_nome", "UNIQUE KEY uk_projeto_nome"), "I01")).toBe(true); // vale também para UNIQUE KEY
  });
  it("I02: mais de 5 índices secundários", () => {
    const muitos = mudar("PRIMARY KEY (cod_cliente),", "PRIMARY KEY (cod_cliente), KEY i_a (cod_projeto, nm_cliente), KEY i_b (cod_projeto, dt_baixa), KEY i_c (cod_projeto, hr_corte), KEY i_d (cod_projeto, vl_limite),");
    expect(tem(muitos, "I02")).toBe(true);
    expect(tem(CONFORME, "I02")).toBe(false);
  });
  it("I03: índice de uma coluna só (não-FK) numa tabela com cod_projeto", () => {
    expect(tem(mudar("PRIMARY KEY (cod_cliente),", "PRIMARY KEY (cod_cliente), KEY i_nome (nm_cliente),"), "I03")).toBe(true);
  });
  it("I03: exceções. Índice só da FK cod_X e a própria PK não são reportados", () => {
    expect(tem(mudar("PRIMARY KEY (cod_cliente),", "PRIMARY KEY (cod_cliente), KEY i_grupo (cod_grupo),"), "I03")).toBe(false);
    expect(tem(CONFORME, "I03")).toBe(false);
  });
  it("I04: UNIQUE sem cod_projeto, de uma coluna ou composto", () => {
    expect(tem(mudar("UNIQUE KEY i_projeto_nome (cod_projeto, nm_cliente)", "UNIQUE KEY i_nome (nm_cliente)"), "I04")).toBe(true);
    expect(tem(mudar("UNIQUE KEY i_projeto_nome (cod_projeto, nm_cliente)", "UNIQUE KEY i_nome_grupo (nm_cliente, cod_grupo)"), "I04")).toBe(true);
    expect(tem(CONFORME, "I04")).toBe(false);
  });
});

describe("padrões v2: §6 ordem das colunas", () => {
  it("O01: ordem fora do canônico", () => {
    const trocada = mudar("cod_cliente int(11) NOT NULL AUTO_INCREMENT,\n  cod_projeto int(11) NOT NULL,", "cod_cliente int(11) NOT NULL AUTO_INCREMENT,\n  nm_primeiro varchar(100) NOT NULL DEFAULT '',\n  cod_projeto int(11) NOT NULL,");
    expect(tem(trocada, "O01")).toBe(true);
    expect(tem(CONFORME, "O01")).toBe(false);
  });
});

describe("padrões v2: §8 perfil tr_", () => {
  const TR = `CREATE TABLE app_bi.tr_site_dia (
    cod_site int(11) NOT NULL,
    qt_chamados int(11) NOT NULL DEFAULT '0',
    dt_referencia date NOT NULL,
    dt_carga datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tr_site_dia_1dia (cod_site, dt_referencia)
  ) ENGINE=InnoDB DEFAULT CHARSET=latin1;`;
  it("conforme", () => {
    expect(rodar(TR).violacoes.filter((v) => v.regra === "R01")).toEqual([]);
    expect(rodar(TR).tabelas[0]!.perfil).toBe("tr");
  });
  it("PK, AUTO_INCREMENT, unique faltando e colunas de controle fora do fim", () => {
    expect(tem(TR.replace("UNIQUE KEY", "PRIMARY KEY (cod_site), UNIQUE KEY"), "R01")).toBe(true);
    expect(tem(TR.replace("cod_site int(11) NOT NULL,", "cod_site int(11) NOT NULL AUTO_INCREMENT,"), "R01")).toBe(true);
    expect(tem(TR.replace("uk_tr_site_dia_1dia", "uk_outro"), "R01")).toBe(true);
    expect(tem(TR.replace("dt_referencia date NOT NULL,\n    dt_carga datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,", "dt_carga datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    dt_referencia date NOT NULL,"), "R01")).toBe(true);
  });
  it("tr_ não exige ts_alteracao nem PK cod_ (as regras de tb_ não se aplicam)", () => {
    const v = ids(rodar(TR));
    expect(v).not.toContain("E07");
    expect(v).not.toContain("E11");
  });
});

describe("padrões v2: §9 perfis _hist e _arc", () => {
  const HIST = `CREATE TABLE app_crm_hist.tb_cliente_hist (
    cod_cliente_hist int(11) NOT NULL AUTO_INCREMENT,
    cod_user_create_hist int(11) NOT NULL,
    cod_processo int(11) NOT NULL,
    dt_criacao_hist datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cod_cliente int(11) NOT NULL,
    cod_projeto int(11) NOT NULL,
    nm_cliente varchar(100) NOT NULL,
    ${TS},
    PRIMARY KEY (cod_cliente_hist)
  ) ENGINE=InnoDB DEFAULT CHARSET=latin1;`;
  it("conforme (nulidade da origem acompanha, sem defaults nas colunas de origem)", () => {
    const r = rodar(HIST);
    expect(r.tabelas[0]!.perfil).toBe("hist");
    expect(r.violacoes.filter((v) => ["H01", "H02", "H03", "H04", "E02"].includes(v.regra))).toEqual([]);
  });
  it("H01: schema sem sufixo _hist", () => {
    expect(tem(HIST.replace("app_crm_hist", "app_crm"), "H01")).toBe(true);
  });
  it("H02: cabeçalho com campo faltando ou fora de ordem", () => {
    expect(tem(HIST.replace("cod_processo int(11) NOT NULL,", ""), "H02")).toBe(true);
    expect(tem(HIST.replace("dt_criacao_hist datetime NOT NULL DEFAULT CURRENT_TIMESTAMP", "dt_criacao_hist datetime NOT NULL"), "H02")).toBe(true);
  });
  it("H03: ts_alteracao ausente ou não-última", () => {
    expect(tem(HIST.replace(`${TS},`, ""), "H03")).toBe(true);
  });
  it("H04: default numa coluna de origem do _hist (aviso)", () => {
    const d = HIST.replace("nm_cliente varchar(100) NOT NULL,", "nm_cliente varchar(100) NOT NULL DEFAULT '',");
    expect(sev(d, "H04")).toBe("aviso");
  });
  it("E02 não vale no _hist: a coluna que admite NULL na origem admite no espelho", () => {
    expect(ids(rodar(HIST.replace("nm_cliente varchar(100) NOT NULL,", "nm_cliente varchar(100) DEFAULT NULL,")))).not.toContain("E02");
  });
  it("_arc: cabeçalho igual ao do _hist, e dispensa ts_alteracao", () => {
    const ARC = HIST.replace("tb_cliente_hist", "tb_cliente_arc").replaceAll("cod_cliente_hist", "cod_cliente_arc").replace(`    ${TS},\n`, "");
    const r = rodar(ARC);
    expect(r.tabelas[0]!.perfil).toBe("arc");
    expect(r.violacoes.filter((v) => ["H01", "H05", "H03"].includes(v.regra))).toEqual([]);
    expect(tem(ARC.replace("cod_user_create_hist int(11) NOT NULL,", ""), "H05")).toBe(true);
  });
  it("L01: nome legado tb_hist_<nome>", () => {
    expect(tem(HIST.replace("tb_cliente_hist", "tb_hist_cliente"), "L01")).toBe(true);
  });
});

describe("padrões v2: §10 e §11 booleanos e legado", () => {
  const coluna = (def: string) => mudar("PRIMARY KEY (cod_cliente),", `${def}, PRIMARY KEY (cod_cliente),`);
  it("B01: flag_ tinyint(1) é aviso em legada e erro em nova", () => {
    const d = coluna("flag_ativo tinyint(1) NOT NULL DEFAULT '0'");
    expect(sev(d, "B01", { modo: "legada" })).toBe("aviso");
    expect(sev(d, "B01", { modo: "nova" })).toBe("erro");
  });
  it("B02: valores de enum fora de Proper Case sem acento", () => {
    expect(tem(coluna("en_x enum('sim','Não') NOT NULL DEFAULT 'sim'"), "B02")).toBe(true);
    expect(rodar(coluna("en_x enum('Sim','Nao','Em Andamento') NOT NULL DEFAULT 'Sim'")).violacoes.filter((v) => v.regra === "B02")).toEqual([]);
  });
  it("L01: e_, cod_ int(10) unsigned, num_, valor_, tx_desc", () => {
    expect(tem(coluna("e_tipo enum('a','b') NOT NULL DEFAULT 'a'"), "L01")).toBe(true);
    expect(tem(coluna("cod_x int(10) unsigned NOT NULL"), "L01")).toBe(true);
    expect(tem(coluna("num_x int(11) NOT NULL DEFAULT '0'"), "L01")).toBe(true);
    expect(tem(coluna("valor_x double NOT NULL DEFAULT '0'"), "L01")).toBe(true);
    expect(tem(coluna("tx_desc varchar(255) NOT NULL DEFAULT ''"), "L01")).toBe(true);
  });
});

describe("padrões v2: §14 schema dd em inglês", () => {
  it("G01: identificador em português dentro de dd", () => {
    expect(tem(CONFORME.replace("app_crm.tb_cliente", "dd.tb_cliente"), "G01")).toBe(true);
  });
  it("tudo em inglês passa", () => {
    const EN = `CREATE TABLE dd.tb_customer (
      cod_customer int(11) NOT NULL AUTO_INCREMENT,
      cod_project int(11) NOT NULL,
      nm_customer varchar(100) NOT NULL DEFAULT '',
      dt_creation datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ts_modification timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (cod_customer)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;`;
    const r = rodar(EN);
    expect(ids(r)).not.toContain("G01");
    expect(ids(r)).not.toContain("E08"); // cod_project é o tenant em inglês
    expect(ids(r)).not.toContain("E11"); // ts_modification é o lema em inglês de ts_alteracao
  });
});

describe("padrões v2: §15 perfil extensão", () => {
  const EXT = `CREATE TABLE app_crm.tb_site_gf (
    cod_site int(11) NOT NULL,
    cod_projeto int(11) NOT NULL,
    qt_alarmes int(11) NOT NULL DEFAULT '0',
    ${TS},
    PRIMARY KEY (cod_site),
    KEY i_projeto_looker (cod_projeto, qt_alarmes)
  ) ENGINE=InnoDB DEFAULT CHARSET=latin1;`;
  it("PK herdada sem AUTO_INCREMENT, sem dt_criacao: conforme", () => {
    const r = rodar(EXT, { extensoes: "tb_site_gf" });
    expect(r.tabelas[0]!.perfil).toBe("extensao");
    expect(r.violacoes).toEqual([]);
  });
  it("sem marcar como extensão, a mesma tabela é cobrada como tb_ padrão", () => {
    expect(rodar(EXT).tabelas[0]!.perfil).toBe("tb");
    expect(ids(rodar(EXT))).toContain("E07");
  });
  it("X01: PK autonumerada, dt_criacao duplicado e schema diferente da raiz", () => {
    expect(tem(EXT.replace("cod_site int(11) NOT NULL,", "cod_site int(11) NOT NULL AUTO_INCREMENT,"), "X01", { extensoes: "tb_site_gf" })).toBe(true);
    expect(tem(EXT.replace("qt_alarmes int(11) NOT NULL DEFAULT '0',", "qt_alarmes int(11) NOT NULL DEFAULT '0', dt_criacao datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,"), "X01", { extensoes: "tb_site_gf" })).toBe(true);
    const raiz = `CREATE TABLE app_outro.tb_site (cod_site int(11) NOT NULL AUTO_INCREMENT, PRIMARY KEY (cod_site)) ENGINE=InnoDB;`;
    expect(tem(`${raiz}\n${EXT}`, "X01", { extensoes: "tb_site_gf:tb_site" })).toBe(true);
  });
  it("E08 e cod_projeto sem DEFAULT valem na extensão", () => {
    expect(tem(EXT.replace("cod_projeto int(11) NOT NULL,", "cod_projeto int(11) NOT NULL DEFAULT '0',"), "D05", { extensoes: "tb_site_gf" })).toBe(true);
    expect(tem(EXT.replace("cod_projeto int(11) NOT NULL,", ""), "E08", { extensoes: "tb_site_gf" })).toBe(true);
  });
});

describe("padrões v2: catálogo", () => {
  it("todo id do catálogo é único e tem explicação", () => {
    const vistos = new Set<string>();
    for (const r of CATALOGO) {
      expect(vistos.has(r.id), r.id).toBe(false);
      vistos.add(r.id);
      expect(r.explicacao.length, r.id).toBeGreaterThan(30);
      expect(r.titulo.length).toBeGreaterThan(3);
    }
  });
  it("o catálogo não cita nome de empresa, usuário nem IP", () => {
    const texto = JSON.stringify(CATALOGO);
    expect(texto).not.toMatch(/vtt|vt_|max\.silva|67\.159|\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/i);
  });
  it("toda violação devolvida é de uma regra que existe", () => {
    const r = rodar(CONFORME.replace("tb_cliente", "cliente").replace("ENGINE=InnoDB", "ENGINE=MyISAM"));
    for (const v of r.violacoes) expect(regraPorId(v.regra), v.regra).toBeDefined();
  });
});
