import { describe, expect, it } from "vitest";
import { alvosDeAtribuicao, comandosDeDml, lerRotinas, referenciasDoComando } from "../../lib/sql/rotinas";
import { parseDdl } from "../../lib/sql/parser";

describe("parser: detalhes novos (opções, índices, defaults, charset)", () => {
  const r = parseDdl(`CREATE TABLE app.tb_x (
    cod_x int(10) unsigned NOT NULL AUTO_INCREMENT,
    nm_x varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '',
    vl_x decimal(12,2) NOT NULL DEFAULT '0.00',
    dt_x datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ts_x timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (cod_x),
    KEY i_nome (nm_x(10)),
    UNIQUE KEY i_un (cod_x, nm_x),
    FULLTEXT KEY ft_x (nm_x),
    INDEX (vl_x)
  ) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='x';`);
  const t = r.tables[0]!;
  it("opções da tabela", () => {
    expect(t.options).toEqual({ engine: "InnoDB", charset: "latin1", collate: "latin1_swedish_ci", autoIncrement: "7" });
    expect(t.comment).toBe("x");
  });
  it("defaults, unsigned, charset e collate da coluna, ON UPDATE", () => {
    const c = (n: string) => t.columns.find((x) => x.name === n)!;
    expect(c("cod_x")).toMatchObject({ unsigned: true, defaultRaw: null });
    expect(c("nm_x")).toMatchObject({ charset: "utf8mb4", collate: "utf8mb4_bin", defaultRaw: "''" });
    expect(c("vl_x").defaultRaw).toBe("'0.00'");
    expect(c("dt_x").defaultRaw).toBe("CURRENT_TIMESTAMP");
    expect(c("ts_x")).toMatchObject({ defaultRaw: "CURRENT_TIMESTAMP", onUpdateRaw: "CURRENT_TIMESTAMP" });
  });
  it("índices com nome, colunas, unicidade e tipo", () => {
    expect(t.indexes.map((i) => ({ n: i.name, u: i.unique, k: i.kind, c: i.columns }))).toEqual([
      { n: "i_nome", u: false, k: "key", c: ["nm_x"] },
      { n: "i_un", u: true, k: "key", c: ["cod_x", "nm_x"] },
      { n: "ft_x", u: false, k: "fulltext", c: ["nm_x"] },
      { n: null, u: false, k: "key", c: ["vl_x"] },
    ]);
    expect(t.primaryKey).toEqual(["cod_x"]);
  });
  it("tabela sem opções declaradas", () => {
    expect(parseDdl("CREATE TABLE t (a INT);").tables[0]!.options).toEqual({ engine: null, charset: null, collate: null, autoIncrement: null });
  });
});

describe("leitor de rotinas", () => {
  it("lê definer, nome, schema e tipo", () => {
    const { rotinas } = lerRotinas("CREATE DEFINER=`max.silva`@`10.1.2.3` PROCEDURE app.sp_x(IN p INT) BEGIN SELECT 1; SELECT 2; END;");
    expect(rotinas[0]).toMatchObject({ nome: "sp_x", schema: "app", tipo: "procedure" });
    expect(rotinas[0]!.definer).toEqual({ raw: "`max.silva`@`10.1.2.3`", usuario: "max.silva", host: "10.1.2.3" });
  });
  it("definer sem crases e com host IP solto", () => {
    const { rotinas } = lerRotinas("CREATE DEFINER=root@localhost PROCEDURE sp_y() SELECT 1;");
    expect(rotinas[0]!.definer).toMatchObject({ usuario: "root", host: "localhost" });
  });
  it("DELIMITER: o ';' dentro do corpo não parte a rotina, e o '$$' colado em END funciona", () => {
    const { rotinas } = lerRotinas("DELIMITER $$\nCREATE PROCEDURE a.sp_x() BEGIN\n UPDATE a.tb_t SET x = 1;\n SELECT 1;\nEND$$\nCREATE PROCEDURE a.sp_y() BEGIN SELECT 1; SELECT 2; END$$\nDELIMITER ;");
    expect(rotinas.map((r) => r.nome)).toEqual(["sp_x", "sp_y"]);
    expect(rotinas[0]!.comandos.map((c) => c.tipo)).toEqual(["UPDATE", "SELECT"]);
    expect(rotinas[0]!.totalDeComandos).toBe(2);
  });
  it("delimitadores '//' e ';;' também funcionam", () => {
    for (const d of ["//", ";;"]) {
      const { rotinas } = lerRotinas(`DELIMITER ${d}\nCREATE PROCEDURE a.sp_x() BEGIN SELECT 1; SELECT 2; END${d}\nDELIMITER ;`);
      expect(rotinas, d).toHaveLength(1);
    }
  });
  it("comando único: corpo de um INSERT/UPDATE/DELETE/SELECT só", () => {
    const { rotinas } = lerRotinas("CREATE PROCEDURE a.sp_x(IN p INT) BEGIN UPDATE a.tb_t SET x = p; END;");
    expect(rotinas[0]!.comandoUnico?.tipo).toBe("UPDATE");
    const dois = lerRotinas("CREATE PROCEDURE a.sp_x(IN p INT) BEGIN UPDATE a.tb_t SET x = p; CALL a.sp_y(); END;");
    expect(dois.rotinas[0]!.comandoUnico).toBeNull();
    const semBegin = lerRotinas("CREATE PROCEDURE a.sp_x(IN p INT) SELECT 1;");
    expect(semBegin.rotinas[0]!.comandoUnico?.tipo).toBe("SELECT");
  });
  it("DECLARE não conta como comando", () => {
    const { rotinas } = lerRotinas("CREATE PROCEDURE a.sp_x() BEGIN DECLARE v INT DEFAULT 0; UPDATE a.tb_t SET x = 1; END;");
    expect(rotinas[0]!.comandoUnico?.tipo).toBe("UPDATE");
  });
  it("acha comandos dentro de IF e de loops", () => {
    const { rotinas } = lerRotinas("CREATE PROCEDURE a.sp_x() BEGIN IF 1 = 1 THEN UPDATE a.tb_t SET x = 1; ELSE DELETE FROM a.tb_t; END IF; WHILE 1 = 0 DO INSERT INTO a.tb_t VALUES (1); END WHILE; END;");
    expect(rotinas[0]!.comandos.map((c) => c.tipo)).toEqual(["UPDATE", "DELETE", "INSERT"]);
  });
  it("trigger e event", () => {
    const t = lerRotinas("CREATE TRIGGER a.tg BEFORE INSERT ON a.tb_t FOR EACH ROW SET NEW.x = 1;");
    expect(t.rotinas[0]).toMatchObject({ tipo: "trigger", nome: "tg", schema: "a" });
    const e = lerRotinas("CREATE EVENT a.ev ON SCHEDULE EVERY 1 DAY DO CALL a.sp_x();");
    expect(e.rotinas[0]!.comandos[0]!.tipo).toBe("CALL");
  });
  it("rotina colada SEM DELIMITER (com ';' no corpo) continua sendo uma rotina só", () => {
    const sql = [
      "CREATE PROCEDURE a.sp_x(IN p INT)",
      "BEGIN",
      "  UPDATE a.tb_t SET x = CASE WHEN p > 0 THEN 1 ELSE 2 END WHERE id = p;",
      "  IF p > 1 THEN",
      "    CALL a.sp_y(p);",
      "  END IF;",
      "END;",
      "CREATE PROCEDURE a.sp_z() SELECT 1;",
    ].join("\n");
    const { rotinas } = lerRotinas(sql);
    expect(rotinas.map((r) => r.nome)).toEqual(["sp_x", "sp_z"]);
    expect(rotinas[0]!.comandos.map((c) => c.tipo)).toEqual(["UPDATE", "CALL"]);
  });
  it("comandos soltos: UPDATE, INSERT, DELETE, CALL, ALTER", () => {
    const { comandosSoltos } = lerRotinas("UPDATE a.t SET x = 1; INSERT INTO a.t VALUES (1); DELETE FROM a.t; CALL a.sp(); ALTER TABLE a.t ADD c INT; SELECT 1;");
    expect(comandosSoltos.map((c) => c.tipo)).toEqual(["UPDATE", "INSERT", "DELETE", "CALL", "ALTER"]);
  });
  it("referências: FROM, JOIN, INTO, UPDATE e CALL, com e sem schema", () => {
    const [c] = comandosDeDml("x", lerRotinas("UPDATE s1.a JOIN b ON 1=1 SET a.x = 1;").comandosSoltos[0]!.tokens);
    void c;
    const cmd = lerRotinas("UPDATE s1.tb_a a JOIN tb_b b ON a.i = b.i SET a.x = 1;").comandosSoltos[0]!;
    expect(referenciasDoComando(cmd).map((r) => `${r.schema ?? "-"}.${r.nome}:${r.via}`)).toEqual(["s1.tb_a:update", "-.tb_b:join"]);
    const call = lerRotinas("CALL s_hist.sp_a_hist(1);").comandosSoltos[0]!;
    expect(referenciasDoComando(call)[0]).toMatchObject({ schema: "s_hist", nome: "sp_a_hist", via: "call" });
  });
  it("alvos de atribuição: SET e ON DUPLICATE KEY UPDATE, sem confundir com comparação", () => {
    const up = lerRotinas("UPDATE a.t SET x = 1, cod_projeto = 2 WHERE y = 3;").comandosSoltos[0]!;
    expect(alvosDeAtribuicao(up)).toEqual(["x", "cod_projeto"]);
    const cmp = lerRotinas("UPDATE a.t SET x = IF(cod_projeto = 1, 1, 2) WHERE cod_projeto = 5;").comandosSoltos[0]!;
    expect(alvosDeAtribuicao(cmp)).toEqual(["x"]);
    const ins = lerRotinas("INSERT INTO a.t (a, cod_projeto) VALUES (1, 2) ON DUPLICATE KEY UPDATE a = VALUES(a), cod_projeto = VALUES(cod_projeto);").comandosSoltos[0]!;
    expect(alvosDeAtribuicao(ins)).toEqual(["a", "cod_projeto"]);
  });
  it("nunca lança com lixo e recusa mais de 1 MB", () => {
    for (const s of ["", "DELIMITER", "DELIMITER $$", "CREATE", "CREATE DEFINER", "CREATE PROCEDURE", "CREATE PROCEDURE (", "BEGIN END", "`", "'", ")))((("]) {
      expect(() => lerRotinas(s), s).not.toThrow();
    }
    expect(lerRotinas("-- " + "x".repeat(1_048_577)).rejeitado).toBe(true);
  });
});
