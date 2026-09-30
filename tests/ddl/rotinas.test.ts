import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { CATALOGO } from "../../lib/ddl/catalogo";
import { OPCOES_PADRAO, verificarPadroes, type OpcoesPadroes, type Violacao } from "../../lib/ddl/verificar";

const rodar = (ddl: string, o: Partial<OpcoesPadroes> = {}) => verificarPadroes(ddl, { ...OPCOES_PADRAO, ...o });
const tem = (ddl: string, id: string, o: Partial<OpcoesPadroes> = {}) => rodar(ddl, o).violacoes.some((v) => v.regra === id);
const sev = (ddl: string, id: string, o: Partial<OpcoesPadroes> = {}) => rodar(ddl, o).violacoes.find((v) => v.regra === id)?.severidade;
const soRegra = (r: { violacoes: Violacao[] }, id: string) => r.violacoes.filter((v) => v.regra === id);

const HIST = `CREATE TABLE app_crm_hist.tb_cliente_hist (
  cod_cliente_hist int(11) NOT NULL AUTO_INCREMENT,
  cod_user_create_hist int(11) NOT NULL,
  cod_processo int(11) NOT NULL,
  dt_criacao_hist datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cod_cliente int(11) NOT NULL,
  nm_cliente varchar(100) NOT NULL,
  ts_alteracao timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (cod_cliente_hist)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
`;

const proc = (nome: string, corpo: string, definer = "`root`@`localhost`") =>
  `DELIMITER $$\nCREATE DEFINER=${definer} PROCEDURE app_crm.${nome}(IN p_cod INT, IN p_user INT, IN p_proc INT)\nBEGIN\n${corpo}\nEND$$\nDELIMITER ;\n`;

const ALTERAR_OK = proc(
  "sp_alterar_cliente",
  `  UPDATE app_crm.tb_cliente SET nm_cliente = 'x' WHERE cod_cliente = p_cod;
  IF ROW_COUNT() > 0 THEN
    CALL app_crm_hist.sp_cliente_hist(p_cod, p_user, p_proc);
  END IF;`,
);
const CRIAR_OK = proc(
  "sp_criar_cliente",
  `  DECLARE v_cod INT DEFAULT 0;
  INSERT INTO app_crm.tb_cliente (cod_projeto, nm_cliente) VALUES (1, 'x');
  IF ROW_COUNT() > 0 THEN
    SET v_cod = LAST_INSERT_ID();
    CALL app_crm_hist.sp_cliente_hist(v_cod, p_user, p_proc);
  END IF;`,
);
const APAGAR_OK = proc(
  "sp_apagar_cliente",
  `  CALL app_crm_hist.sp_cliente_arc(p_cod, p_user, p_proc);
  DELETE FROM app_crm.tb_cliente
  WHERE cod_cliente = p_cod
    AND EXISTS (SELECT 1 FROM app_crm_hist.tb_cliente_arc a WHERE a.cod_cliente = p_cod);`,
);

describe("padrões v2 rotinas: rotinas conformes", () => {
  it("alterar, criar e apagar conformes não geram violação (com a tabela de histórico no script)", () => {
    for (const r of [ALTERAR_OK, CRIAR_OK, APAGAR_OK]) {
      const v = rodar(HIST + r).violacoes.filter((x) => x.tipoObjeto !== "tabela");
      expect(v, JSON.stringify(v)).toEqual([]);
    }
  });
});

describe("§12 DEFINER", () => {
  it("usuário pessoal com host remoto: ERRO em rotina nova", () => {
    const r = proc("sp_alterar_cliente", "  SELECT 1;", "`max.silva`@`10.0.0.5`");
    expect(sev(r, "S01", { modo: "nova" })).toBe("erro");
  });
  it("o mesmo definer em rotina legada é AVISO (migrar na próxima alteração)", () => {
    const r = proc("sp_alterar_cliente", "  SELECT 1;", "`max.silva`@`10.0.0.5`");
    expect(sev(r, "S01", { modo: "legada" })).toBe("aviso");
  });
  it("root em host diferente de localhost também é errado", () => {
    expect(tem(proc("sp_x", "  SELECT 1;", "`root`@`%`"), "S01")).toBe(true);
  });
  it("root@localhost passa, com ou sem crases", () => {
    expect(tem(proc("sp_alterar_cliente", "  SELECT 1;"), "S01")).toBe(false);
    expect(tem(proc("sp_alterar_cliente", "  SELECT 1;", "root@localhost"), "S01")).toBe(false);
    expect(tem(proc("sp_alterar_cliente", "  SELECT 1;", "'root'@'localhost'"), "S01")).toBe(false);
  });
  it("sem DEFINER explícito: aviso", () => {
    const r = "CREATE PROCEDURE app_crm.sp_alterar_cliente(IN p INT) BEGIN SELECT 1; SELECT 2; END;";
    expect(sev(r, "S01")).toBe("aviso");
  });
  it("vale para function, trigger e event", () => {
    const f = "CREATE DEFINER=`ana`@`%` FUNCTION app_crm.fn_x(p INT) RETURNS INT DETERMINISTIC RETURN p;";
    const t = "CREATE DEFINER=`ana`@`%` TRIGGER app_crm.tg_x BEFORE INSERT ON app_crm.tb_cliente FOR EACH ROW SET NEW.nm_cliente = 'x';";
    const e = "CREATE DEFINER=`ana`@`%` EVENT app_crm.ev_x ON SCHEDULE EVERY 1 DAY DO CALL app_crm.sp_alterar_cliente(1, 1, 1);";
    for (const sql of [f, t, e]) expect(sev(sql, "S01", { modo: "nova" }), sql).toBe("erro");
  });
});

describe("§12 acionamento do histórico", () => {
  it("S03: UPDATE em tabela versionada sem chamar o histórico é ERRO", () => {
    const r = HIST + proc("sp_alterar_cliente", "  UPDATE app_crm.tb_cliente SET nm_cliente = 'x' WHERE cod_cliente = p_cod;\n  SELECT 1;");
    expect(sev(r, "S03")).toBe("erro");
  });
  it("S03: sem o _hist no script a ferramenta só avisa, porque não sabe se a tabela é versionada", () => {
    const r = proc("sp_alterar_cliente", "  UPDATE app_crm.tb_cliente SET nm_cliente = 'x' WHERE cod_cliente = p_cod;\n  SELECT 1;");
    expect(sev(r, "S03")).toBe("aviso");
  });
  it("S03: a chamada antes do UPDATE não conta (o histórico lê a linha já atualizada)", () => {
    const r = HIST + proc("sp_alterar_cliente", "  CALL app_crm_hist.sp_cliente_hist(p_cod, p_user, p_proc);\n  UPDATE app_crm.tb_cliente SET nm_cliente = 'x' WHERE cod_cliente = p_cod;");
    expect(tem(r, "S03")).toBe(true);
  });
  it("S04: UPDATE com histórico mas sem guarda ROW_COUNT", () => {
    const r = HIST + proc("sp_alterar_cliente", "  UPDATE app_crm.tb_cliente SET nm_cliente = 'x' WHERE cod_cliente = p_cod;\n  CALL app_crm_hist.sp_cliente_hist(p_cod, p_user, p_proc);");
    expect(tem(r, "S04")).toBe(true);
    expect(tem(r, "S03")).toBe(false);
  });
  it("S03: INSERT sem histórico; e S04 sem LAST_INSERT_ID e sem ROW_COUNT", () => {
    const sem = HIST + proc("sp_criar_cliente", "  INSERT INTO app_crm.tb_cliente (cod_projeto, nm_cliente) VALUES (1, 'x');\n  SELECT 1;");
    expect(sev(sem, "S03")).toBe("erro");
    const meio = HIST + proc("sp_criar_cliente", "  INSERT INTO app_crm.tb_cliente (cod_projeto, nm_cliente) VALUES (1, 'x');\n  CALL app_crm_hist.sp_cliente_hist(1, p_user, p_proc);");
    const s4 = soRegra(rodar(meio), "S04");
    expect(s4.length).toBe(2);
    expect(s4.map((v) => v.detalhe).join(" ")).toMatch(/LAST_INSERT_ID/);
    expect(s4.map((v) => v.detalhe).join(" ")).toMatch(/ROW_COUNT/);
  });
  it("S05: DELETE sem chamar o _arc antes, e sem a guarda EXISTS, é ERRO", () => {
    const r = HIST + proc("sp_apagar_cliente", "  DELETE FROM app_crm.tb_cliente WHERE cod_cliente = p_cod;\n  SELECT 1;");
    const v = soRegra(rodar(r), "S05");
    expect(v.length).toBe(2);
    expect(v.every((x) => x.severidade === "erro")).toBe(true);
  });
  it("S05: chamar o _arc DEPOIS do DELETE não serve (o dado já se perdeu)", () => {
    const r = HIST + proc("sp_apagar_cliente", "  DELETE FROM app_crm.tb_cliente WHERE cod_cliente = p_cod AND EXISTS (SELECT 1 FROM app_crm_hist.tb_cliente_arc a WHERE a.cod_cliente = p_cod);\n  CALL app_crm_hist.sp_cliente_arc(p_cod, p_user, p_proc);");
    expect(tem(r, "S05")).toBe(true);
  });
  it("S05: arc antes mas DELETE sem EXISTS é erro", () => {
    const r = HIST + proc("sp_apagar_cliente", "  CALL app_crm_hist.sp_cliente_arc(p_cod, p_user, p_proc);\n  DELETE FROM app_crm.tb_cliente WHERE cod_cliente = p_cod;");
    const v = soRegra(rodar(r), "S05");
    expect(v).toHaveLength(1);
    expect(v[0]!.detalhe).toMatch(/EXISTS/);
    expect(v[0]!.severidade).toBe("erro");
  });
  it("escrita em tabela que não é tb_ ou é a própria _hist não cobra histórico", () => {
    const r = HIST + proc("sp_criar_log", "  INSERT INTO app_crm.tmp_x (a) VALUES (1);\n  INSERT INTO app_crm_hist.tb_cliente_hist (cod_cliente) VALUES (1);");
    expect(tem(r, "S03")).toBe(false);
  });
});

describe("§12 rotina de comando único", () => {
  it("S06: um UPDATE só é aviso", () => {
    const r = proc("sp_alterar_cliente", "  UPDATE app_crm.tb_cliente SET nm_cliente = 'x' WHERE cod_cliente = p_cod;");
    expect(sev(r, "S06")).toBe("aviso");
  });
  it("S06: um SELECT só também é aviso", () => {
    expect(sev(proc("sp_buscar_cliente", "  SELECT * FROM app_crm.tb_cliente WHERE cod_cliente = p_cod;"), "S06")).toBe("aviso");
  });
  it("S06 escala para ERRO se escreve em tabela versionada sem histórico", () => {
    const r = HIST + proc("sp_alterar_cliente", "  UPDATE app_crm.tb_cliente SET nm_cliente = 'x' WHERE cod_cliente = p_cod;");
    expect(sev(r, "S06")).toBe("erro");
    expect(tem(r, "S03")).toBe(true);
  });
  it("sp_<tabela>_hist e sp_<tabela>_arc são exceção: comando único é o esperado", () => {
    const h = proc("sp_cliente_hist", "  INSERT INTO app_crm_hist.tb_cliente_hist (cod_cliente) SELECT cod_cliente FROM app_crm.tb_cliente WHERE cod_cliente = p_cod;").replace("app_crm.sp_cliente_hist", "app_crm_hist.sp_cliente_hist");
    expect(tem(h, "S06")).toBe(false);
    const a = proc("sp_cliente_arc", "  INSERT INTO app_crm_hist.tb_cliente_arc (cod_cliente) SELECT cod_cliente FROM app_crm.tb_cliente WHERE cod_cliente = p_cod;").replace("app_crm.sp_cliente_arc", "app_crm_hist.sp_cliente_arc");
    expect(tem(a, "S06")).toBe(false);
  });
  it("rotina com guarda e chamada não é comando único", () => {
    expect(tem(ALTERAR_OK, "S06")).toBe(false);
  });
});

describe("§12 nome, local e lock", () => {
  it("S02: nome sem sp_ e função desconhecida", () => {
    expect(tem(proc("proc_x", "  SELECT 1;\n  SELECT 2;"), "S02")).toBe(true);
    expect(tem(proc("sp_mexer_cliente", "  SELECT 1;\n  SELECT 2;"), "S02")).toBe(true);
    expect(tem(proc("sp_alterar_cliente", "  SELECT 1;\n  SELECT 2;"), "S02")).toBe(false);
  });
  it("S07: sp_<tabela>_hist fora do schema de histórico", () => {
    expect(tem(proc("sp_cliente_hist", "  INSERT INTO app_crm_hist.tb_cliente_hist (cod_cliente) VALUES (1);\n  SELECT 1;"), "S07")).toBe(true);
  });
  const LOCK_OK = proc(
    "sp_rodar_lock",
    `  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    DO RELEASE_LOCK('sp_rodar_lock');
    RESIGNAL;
  END;
  IF GET_LOCK('sp_rodar_lock', 0) = 0 THEN
    LEAVE proc_label;
  END IF;
  CALL app_crm.sp_rodar(p_cod, p_user, p_proc);
  DO RELEASE_LOCK('sp_rodar_lock');`,
  );
  it("S08: wrapper conforme", () => {
    expect(rodar(LOCK_OK).violacoes.filter((v) => v.regra === "S08")).toEqual([]);
  });
  it("S08: string do GET_LOCK diferente do nome, espera diferente de 0, sem RELEASE_LOCK, sem RESIGNAL", () => {
    expect(tem(LOCK_OK.replace("GET_LOCK('sp_rodar_lock', 0)", "GET_LOCK('outro', 0)"), "S08")).toBe(true);
    expect(tem(LOCK_OK.replace("GET_LOCK('sp_rodar_lock', 0)", "GET_LOCK('sp_rodar_lock', 10)"), "S08")).toBe(true);
    expect(tem(LOCK_OK.replaceAll("RELEASE_LOCK('sp_rodar_lock')", "SELECT 1"), "S08")).toBe(true);
    expect(tem(LOCK_OK.replace("RESIGNAL;", "SELECT 1;"), "S08")).toBe(true);
  });
});

describe("§7 cod_projeto é imutável", () => {
  it("A01: UPDATE ... SET cod_projeto, solto ou dentro de rotina, é ERRO", () => {
    const solto = "UPDATE app_crm.tb_cliente SET cod_projeto = 9 WHERE cod_cliente = 1;";
    expect(sev(solto, "A01")).toBe("erro");
    const dentro = proc("sp_alterar_cliente", "  UPDATE app_crm.tb_cliente SET nm_cliente = 'x', cod_projeto = p_cod WHERE cod_cliente = 1;\n  SELECT 1;");
    expect(sev(dentro, "A01")).toBe("erro");
  });
  it("A01: também em ON DUPLICATE KEY UPDATE", () => {
    const sql = "INSERT INTO app_crm.tb_cliente (cod_cliente, cod_projeto) VALUES (1, 2) ON DUPLICATE KEY UPDATE cod_projeto = VALUES(cod_projeto);";
    expect(sev(sql, "A01")).toBe("erro");
  });
  it("A01 não dispara em INSERT e em WHERE (usos corretos)", () => {
    expect(tem("INSERT INTO app_crm.tb_cliente (cod_projeto, nm_cliente) VALUES (1, 'x');", "A01")).toBe(false);
    expect(tem("UPDATE app_crm.tb_cliente SET nm_cliente = 'x' WHERE cod_projeto = 1 AND cod_cliente = 2;", "A01")).toBe(false);
    expect(tem("UPDATE app_crm.tb_cliente SET nm_cliente = 'x' WHERE cod_cliente = 1 AND cod_projeto = cod_projeto;", "A01")).toBe(false);
  });
  it("A01: comparação com cod_projeto dentro de expressão do SET não é atribuição", () => {
    expect(tem("UPDATE app_crm.tb_cliente SET nm_cliente = IF(cod_projeto = 1, 'a', 'b') WHERE cod_cliente = 1;", "A01")).toBe(false);
  });
  it("A01: re-chavear a própria tb_projeto é só aviso (exceção estreita, desencorajada)", () => {
    expect(sev("UPDATE app_adm.tb_projeto SET cod_projeto = 9 WHERE cod_projeto = 1;", "A01")).toBe("aviso");
  });
});

describe("§13 qualificação de schema", () => {
  it("Q01: referência de outro schema (_hist) sem qualificar é ERRO; do mesmo schema é aviso", () => {
    const hist = proc("sp_alterar_cliente", "  UPDATE tb_cliente SET nm_cliente = 'x' WHERE cod_cliente = p_cod;\n  CALL sp_cliente_hist(p_cod, p_user, p_proc);");
    const v = soRegra(rodar(hist), "Q01");
    expect(v.find((x) => /tb_cliente/.test(x.detalhe))?.severidade).toBe("aviso");
    expect(v.find((x) => /sp_cliente_hist/.test(x.detalhe))?.severidade).toBe("erro");
  });
  it("Q01: tudo qualificado passa", () => {
    expect(soRegra(rodar(HIST + ALTERAR_OK), "Q01")).toEqual([]);
  });
  it("Q01: CREATE TABLE e CREATE PROCEDURE sem schema", () => {
    expect(tem("CREATE TABLE tb_x (cod_x int(11) NOT NULL AUTO_INCREMENT, PRIMARY KEY (cod_x)) ENGINE=InnoDB;", "Q01")).toBe(true);
    expect(tem("CREATE DEFINER=`root`@`localhost` PROCEDURE sp_criar_x() BEGIN SELECT 1; SELECT 2; END;", "Q01")).toBe(true);
  });
  it("Q01: comando solto sem schema", () => {
    expect(tem("DELETE FROM tb_cliente WHERE cod_cliente = 1;", "Q01")).toBe(true);
    expect(tem("SELECT * FROM app_crm.tb_cliente;", "Q01")).toBe(false);
  });
  it("Q01 não acusa tabela temporária nem alias (só nomes tb_/tr_/sp_)", () => {
    expect(tem(proc("sp_alterar_cliente", "  UPDATE app_crm.tb_cliente c JOIN tmp_x t ON t.a = c.a SET c.nm_cliente = t.nm;\n  SELECT 1;"), "Q01")).toBe(false);
  });
});

describe("leitura do script", () => {
  it("DELIMITER com corpo que tem ';' dentro não quebra a rotina em pedaços", () => {
    const r = rodar(ALTERAR_OK);
    expect(r.rotinas).toHaveLength(1);
    expect(r.rotinas[0]).toMatchObject({ nome: "sp_alterar_cliente", schema: "app_crm", tipo: "procedure" });
  });
  it("várias rotinas e uma tabela no mesmo script", () => {
    const r = rodar(HIST + ALTERAR_OK + CRIAR_OK + APAGAR_OK);
    expect(r.rotinas.map((x) => x.nome)).toEqual(["sp_alterar_cliente", "sp_criar_cliente", "sp_apagar_cliente"]);
    expect(r.tabelas).toHaveLength(1);
  });
  it("entrada acima de 1 MB é recusada", () => {
    const r = rodar("-- " + "x".repeat(1_048_577));
    expect(r.rejeitado).toBe(true);
    expect(r.violacoes).toEqual([]);
  });
});

describe("regras: cobertura e propriedades", () => {
  const SCRIPT_RICO = [
    `CREATE TABLE cliente (id int(10) unsigned NOT NULL AUTO_INCREMENT, nome varchar(50), PRIMARY KEY (id), KEY i_a (nome)) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE app_bi.tr_x (cod_x int(11) NOT NULL, dt_referencia date NOT NULL, dt_carga datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uk_tr_x_1dia (cod_x, dt_referencia)) ENGINE=InnoDB;`,
    `CREATE TABLE app_crm.tb_site_gf (cod_site int(11) NOT NULL, cod_projeto int(11) NOT NULL, ts_alteracao timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (cod_site)) ENGINE=InnoDB;`,
    HIST,
    HIST.replace("tb_cliente_hist", "tb_cliente_arc").replaceAll("cod_cliente_hist", "cod_cliente_arc"),
    `CREATE TABLE dd.tb_x (cod_x int(11) NOT NULL AUTO_INCREMENT, PRIMARY KEY (cod_x)) ENGINE=InnoDB;`,
    ALTERAR_OK, CRIAR_OK, APAGAR_OK,
    proc("sp_rodar_lock", "  IF GET_LOCK('sp_rodar_lock', 0) = 0 THEN LEAVE l; END IF;\n  DO RELEASE_LOCK('sp_rodar_lock');"),
    "UPDATE app_crm.tb_cliente SET cod_projeto = 1 WHERE cod_cliente = 1;",
  ].join("\n");

  it("um script variado exerce TODAS as regras do catálogo", () => {
    const r = rodar(SCRIPT_RICO, { extensoes: "tb_site_gf" });
    const faltando = CATALOGO.map((x) => x.id).filter((id) => !r.regrasVerificadas.includes(id));
    expect(faltando).toEqual([]);
  });

  it("propriedade: nunca lança, é determinístico e só devolve regras do catálogo, com entrada qualquer", () => {
    const ids = new Set(CATALOGO.map((x) => x.id));
    const pedacos = fc.constantFrom("CREATE TABLE ", "CREATE PROCEDURE ", "DELIMITER $$", "BEGIN", "END", "UPDATE ", "SET ", "cod_projeto = 1", ";", "(", ")", "`", "'", "DEFINER=", "@", "CALL ", "tb_x", "sp_x", "\n");
    fc.assert(
      fc.property(fc.oneof(fc.string({ maxLength: 300 }), fc.array(pedacos, { maxLength: 60 }).map((p) => p.join(" "))), (texto) => {
        const a = rodar(texto);
        expect(rodar(texto)).toEqual(a);
        for (const v of a.violacoes) expect(ids.has(v.regra), v.regra).toBe(true);
      }),
      { numRuns: 500 },
    );
  });

  it("propriedade: a ordem das tabelas no script não muda o conjunto de violações", () => {
    const tabelas = [
      "CREATE TABLE app_a.tb_a (cod_a int(11) NOT NULL AUTO_INCREMENT, nm_a varchar(100), PRIMARY KEY (cod_a)) ENGINE=InnoDB;",
      "CREATE TABLE app_a.tb_b (id int(11) NOT NULL, PRIMARY KEY (id)) ENGINE=MyISAM;",
      "CREATE TABLE app_a.tr_c (cod_c int(11) NOT NULL, dt_referencia date NOT NULL, dt_carga datetime NOT NULL, UNIQUE KEY uk_tr_c_1dia (cod_c, dt_referencia)) ENGINE=InnoDB;",
    ];
    const chave = (v: Violacao) => `${v.regra}|${v.objeto}|${v.detalhe}`;
    fc.assert(
      fc.property(fc.shuffledSubarray(tabelas, { minLength: 1, maxLength: 3 }), (sub) => {
        const base = rodar(sub.join("\n")).violacoes.map(chave).sort();
        const invertido = rodar([...sub].reverse().join("\n")).violacoes.map(chave).sort();
        expect(invertido).toEqual(base);
      }),
      { numRuns: 100 },
    );
  });

  it("entrada hostil de 1 MB termina rápido", () => {
    const t0 = performance.now();
    rodar("CREATE PROCEDURE x() BEGIN " + "UPDATE t SET a = 1; ".repeat(40_000));
    rodar("DELIMITER $$\n" + "CREATE PROCEDURE x() BEGIN ".repeat(20_000));
    rodar("(".repeat(500_000));
    expect(performance.now() - t0).toBeLessThan(8_000);
  });
});
