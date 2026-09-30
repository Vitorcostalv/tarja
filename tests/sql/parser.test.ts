import { describe, expect, it } from "vitest";
import { parseDdl } from "../../lib/sql/parser";
import { LIMITS, utf8ByteLength } from "../../lib/limits";

const col = (ddl: string, table = 0) => parseDdl(ddl).tables[table]!.columns;

describe("parseDdl: o básico", () => {
  it("lê várias tabelas, tipos, nulabilidade e chaves", () => {
    const r = parseDdl(`
      CREATE TABLE clientes (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        nome VARCHAR(100) NOT NULL,
        cpf CHAR(14) NULL,
        PRIMARY KEY (id)
      );
      CREATE TABLE pedidos (
        id BIGINT PRIMARY KEY,
        cliente_id INT NOT NULL,
        total DECIMAL(10,2) DEFAULT 0.00,
        CONSTRAINT fk_cli FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE
      );`);
    expect(r.errors).toEqual([]);
    expect(r.tables.map((t) => t.name)).toEqual(["clientes", "pedidos"]);
    const clientes = r.tables[0]!;
    const pedidos = r.tables[1]!;
    expect(clientes.primaryKey).toEqual(["id"]);
    expect(clientes.columns[0]).toMatchObject({ name: "id", baseType: "int", nullable: false, autoIncrement: true, isPrimaryKey: true });
    expect(clientes.columns[1]).toMatchObject({ rawType: "VARCHAR(100)", typeArgs: "100", nullable: false });
    expect(clientes.columns[2]).toMatchObject({ rawType: "CHAR(14)", nullable: true });
    expect(pedidos.columns[0]?.isPrimaryKey).toBe(true);
    expect(pedidos.columns[2]).toMatchObject({ typeArgs: "10,2", hasDefault: true });
    expect(pedidos.foreignKeys).toEqual([{ columns: ["cliente_id"], refTable: "clientes", refColumns: ["id"] }]);
  });

  it("lê COMMENT de coluna e de tabela", () => {
    const r = parseDdl("CREATE TABLE t (a INT COMMENT 'Código do usuário', b INT) COMMENT='Tabela de teste';");
    expect(r.tables[0]?.columns[0]?.comment).toBe("Código do usuário");
    expect(r.tables[0]?.columns[1]?.comment).toBeNull();
    expect(r.tables[0]?.comment).toBe("Tabela de teste");
  });

  it("lê schema.tabela, IF NOT EXISTS e TEMPORARY", () => {
    const r = parseDdl("CREATE TEMPORARY TABLE IF NOT EXISTS `loja`.`itens` (id INT);");
    expect(r.tables[0]).toMatchObject({ name: "itens", schema: "loja" });
  });

  it("lê REFERENCES direto na coluna", () => {
    const r = parseDdl("CREATE TABLE t (uid INT REFERENCES usuarios(id));");
    expect(r.tables[0]?.foreignKeys).toEqual([{ columns: ["uid"], refTable: "usuarios", refColumns: ["id"] }]);
  });

  it("ignora índices, UNIQUE, FULLTEXT e CHECK sem criar coluna", () => {
    const r = parseDdl(`CREATE TABLE t (
      a INT, b VARCHAR(10),
      UNIQUE KEY uq (a), KEY ix (b(5)), FULLTEXT KEY ft (b), CHECK (a > 0), INDEX (a, b)
    );`);
    expect(r.errors).toEqual([]);
    expect(r.tables[0]?.columns.map((c) => c.name)).toEqual(["a", "b"]);
  });

  it("entende tipos com mais de uma palavra e modificadores", () => {
    const c = col(`CREATE TABLE t (
      a DOUBLE PRECISION NOT NULL,
      b VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'x',
      c TIMESTAMP DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      d INT GENERATED ALWAYS AS (a * 2) STORED,
      e VARCHAR(5) UNIQUE KEY
    );`);
    expect(c.map((x) => x.baseType)).toEqual(["double precision", "varchar", "timestamp", "int", "varchar"]);
    expect(c[0]?.nullable).toBe(false);
    expect(c[1]).toMatchObject({ nullable: false, hasDefault: true });
    expect(c[2]?.hasDefault).toBe(true);
  });
});

describe("parseDdl: bordas de sintaxe", () => {
  it("backticks com crase duplicada e aspas dentro do nome", () => {
    const c = col("CREATE TABLE t (`a``b` INT, `c\"d` INT, `e'f` INT, `sp ace` INT);");
    expect(c.map((x) => x.name)).toEqual(["a`b", 'c"d', "e'f", "sp ace"]);
  });

  it("comentários --, # e /* */ no meio do DDL", () => {
    const r = parseDdl(`CREATE TABLE t ( -- abre
      a INT, # primeira
      /* meio
         multilinha */ b INT, -- b
      c /* inline */ INT
    ); -- fim`);
    expect(r.errors).toEqual([]);
    expect(r.tables[0]?.columns.map((x) => x.name)).toEqual(["a", "b", "c"]);
  });

  it("'--' colado no próximo caractere não é comentário (regra do MySQL)", () => {
    const r = parseDdl("CREATE TABLE t (a INT DEFAULT 1--1);");
    expect(r.tables[0]?.columns).toHaveLength(1);
  });

  it("comentário executável /*! ... */ do mysqldump não atrapalha", () => {
    const r = parseDdl("/*!40101 SET NAMES utf8 */;\nCREATE TABLE t (a INT) /*!40101 DEFAULT CHARSET=utf8 */;");
    expect(r.tables).toHaveLength(1);
    expect(r.errors).toEqual([]);
  });

  it("ENUM com vírgulas, parênteses e aspas dentro das strings", () => {
    const c = col("CREATE TABLE t (s ENUM('a,b','c)d','e''f','g\\'h') NOT NULL, z INT);");
    expect(c[0]?.enumValues).toEqual(["a,b", "c)d", "e'f", "g'h"]);
    expect(c[1]?.name).toBe("z");
  });

  it("SET também guarda os valores", () => {
    expect(col("CREATE TABLE t (s SET('x','y'));")[0]?.enumValues).toEqual(["x", "y"]);
  });

  it("tabela vazia", () => {
    const r = parseDdl("CREATE TABLE vazia ();");
    expect(r.errors).toEqual([]);
    expect(r.tables[0]).toMatchObject({ name: "vazia", columns: [] });
  });

  it("nomes com acento, com e sem crase", () => {
    const r = parseDdl("CREATE TABLE `inscrição` (`número` INT, açaí VARCHAR(5), ñ INT);");
    expect(r.tables[0]?.name).toBe("inscrição");
    expect(r.tables[0]?.columns.map((x) => x.name)).toEqual(["número", "açaí", "ñ"]);
  });

  it("palavras reservadas entre crases viram colunas normais", () => {
    const c = col("CREATE TABLE t (`key` INT, `index` INT, `primary` INT);");
    expect(c.map((x) => x.name)).toEqual(["key", "index", "primary"]);
  });

  it("entende PRIMARY KEY composta", () => {
    const r = parseDdl("CREATE TABLE t (a INT, b INT, PRIMARY KEY (a, `b`));");
    expect(r.tables[0]?.primaryKey).toEqual(["a", "b"]);
    expect(r.tables[0]?.columns.every((x) => x.isPrimaryKey)).toBe(true);
  });

  it("aceita vírgula sobrando antes do parêntese", () => {
    expect(parseDdl("CREATE TABLE t (a INT,);").tables[0]?.columns).toHaveLength(1);
  });

  it("aceita CRLF e conta as linhas certo", () => {
    const r = parseDdl("CREATE TABLE t (\r\n a INT,\r\n b INT\r\n);\r\n");
    expect(r.tables[0]?.columns.map((x) => x.line)).toEqual([2, 3]);
  });
});

describe("parseDdl: erro nunca derruba, analisa o que dá", () => {
  it("coluna sem tipo vira erro e as outras seguem", () => {
    const r = parseDdl("CREATE TABLE t (a INT, quebrada, c INT);");
    expect(r.tables[0]?.columns.map((x) => x.name)).toEqual(["a", "c"]);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]?.snippet).toContain("quebrada");
    expect(r.errors[0]?.line).toBe(1);
  });

  it("tabela sem ')' e sem ';' seguida de outra tabela", () => {
    const r = parseDdl("CREATE TABLE a (x INT, y INT\nCREATE TABLE b (z INT);");
    expect(r.tables.map((t) => t.name)).toEqual(["a", "b"]);
    expect(r.tables[0]?.columns.map((x) => x.name)).toEqual(["x", "y"]);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("duas tabelas sem ';' entre elas", () => {
    const r = parseDdl("CREATE TABLE a (x INT)\nCREATE TABLE b (z INT)");
    expect(r.tables.map((t) => t.name)).toEqual(["a", "b"]);
    expect(r.errors).toEqual([]);
  });

  it("aspas sem fechamento: erro com trecho, e a tabela seguinte ainda é lida", () => {
    const r = parseDdl("CREATE TABLE a (x VARCHAR(5) COMMENT 'aberto, y INT);\nCREATE TABLE b (z INT);");
    expect(r.tables.map((t) => t.name)).toContain("b");
    expect(r.errors.some((e) => e.message.includes("sem fechamento"))).toBe(true);
    expect(r.errors[0]?.snippet).toContain("'aberto");
  });

  it("comentário de bloco sem fechamento avisa e ignora o resto", () => {
    const r = parseDdl("CREATE TABLE a (x INT);\n/* nunca fecha\nCREATE TABLE b (z INT);");
    expect(r.tables.map((t) => t.name)).toEqual(["a"]);
    expect(r.errors[0]?.message).toContain("sem fechamento");
  });

  it("texto que não é SQL vira erro, não exceção", () => {
    const r = parseDdl("isto não é sql");
    expect(r.tables).toEqual([]);
    expect(r.errors[0]?.snippet).toContain("isto");
  });

  it("CREATE TABLE sem nome e sem parêntese", () => {
    expect(parseDdl("CREATE TABLE;").errors).toHaveLength(1);
    expect(parseDdl("CREATE TABLE t;").errors).toHaveLength(1);
  });

  it("entrada vazia, só espaços ou só comentário", () => {
    for (const s of ["", "   \n\t", "-- só comentário", "/* nada */"]) {
      const r = parseDdl(s);
      expect(r.tables).toEqual([]);
      expect(r.errors).toEqual([]);
    }
  });
});

describe("parseDdl: fora do escopo do MVP", () => {
  it("ALTER, VIEW, INSERT, DROP são ignorados e listados", () => {
    const r = parseDdl(`
      DROP TABLE IF EXISTS t;
      CREATE TABLE t (a INT);
      ALTER TABLE t ADD COLUMN b INT;
      CREATE VIEW v AS SELECT * FROM t;
      INSERT INTO t VALUES (1);
      CREATE TABLE copia LIKE t;
    `);
    expect(r.tables.map((t) => t.name)).toEqual(["t"]);
    expect(r.ignored.map((x) => x.kind)).toEqual([
      "DROP TABLE",
      "ALTER TABLE",
      "CREATE VIEW",
      "INSERT",
      "CREATE TABLE LIKE",
    ]);
    expect(r.errors).toEqual([]);
  });
});

describe("parseDdl: limites", () => {
  it("recusa entrada acima de 1 MB medida em bytes UTF-8, não em caracteres", () => {
    const text = "é".repeat(600_000); // 600 mil caracteres, 1,2 MB em UTF-8
    expect(text.length).toBeLessThan(LIMITS.maxInputBytes);
    expect(utf8ByteLength(text)).toBeGreaterThan(LIMITS.maxInputBytes);
    const r = parseDdl(text);
    expect(r.rejected).toBe(true);
    expect(r.errors[0]?.message).toMatch(/1 MB/);
    expect(r.tables).toEqual([]);
  });

  it("aceita entrada exatamente no limite", () => {
    const base = "CREATE TABLE t (a INT);\n";
    const text = base + "-- " + "x".repeat(LIMITS.maxInputBytes - base.length - 3);
    expect(utf8ByteLength(text)).toBe(LIMITS.maxInputBytes);
    const r = parseDdl(text);
    expect(r.rejected).toBe(false);
    expect(r.tables).toHaveLength(1);
  });

  it("recusa 1 byte acima do limite", () => {
    const base = "CREATE TABLE t (a INT);\n";
    const text = base + "-- " + "x".repeat(LIMITS.maxInputBytes - base.length - 2);
    expect(parseDdl(text).rejected).toBe(true);
  });

  it("corta tabelas acima do limite com aviso", () => {
    const ddl = Array.from({ length: LIMITS.maxTables + 5 }, (_, i) => `CREATE TABLE t${i} (a INT);`).join("\n");
    const r = parseDdl(ddl);
    expect(r.tables).toHaveLength(LIMITS.maxTables);
    expect(r.limitNotices.join(" ")).toMatch(/tabelas/);
  });

  it("corta colunas acima do limite com aviso", () => {
    const cols = Array.from({ length: LIMITS.maxColumnsPerTable + 10 }, (_, i) => `c${i} INT`).join(",");
    const r = parseDdl(`CREATE TABLE t (${cols});`);
    expect(r.tables[0]?.columns).toHaveLength(LIMITS.maxColumnsPerTable);
    expect(r.limitNotices.join(" ")).toMatch(/colunas/);
  });

  it("corta identificador gigante com aviso", () => {
    const big = "a".repeat(LIMITS.maxIdentifierLength + 50);
    const r = parseDdl(`CREATE TABLE t (\`${big}\` INT);`);
    expect(r.tables[0]?.columns[0]?.name).toHaveLength(LIMITS.maxIdentifierLength);
    expect(r.limitNotices.join(" ")).toMatch(/cortado/);
  });

  it("teto de mensagens de erro em entrada cheia de lixo", () => {
    const r = parseDdl("lixo;\n".repeat(5000));
    expect(r.errors.length).toBeLessThanOrEqual(201);
    expect(r.errors[r.errors.length - 1]?.message).toMatch(/Mais \d+ problemas/);
  });
});
