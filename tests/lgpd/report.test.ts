import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { analisarDdl } from "../../lib/lgpd/analyze";
import { celulaCsv, deJson, escMd, paraCsv, paraJson, paraMarkdown } from "../../lib/lgpd/export";
import { AVISO, gerarRelatorio, resumir, type LinhaRelatorio, type Relatorio } from "../../lib/lgpd/report";
import { RETENCAO_PADRAO } from "../../lib/lgpd/rules/protecao";

const DDL = `
CREATE TABLE clientes (
  id INT, nome VARCHAR(100), cpf CHAR(11), email VARCHAR(100), observacao TEXT, criado_em DATETIME
);
CREATE TABLE pacientes (id INT, diagnostico TEXT, nome_responsavel VARCHAR(80));
CREATE TABLE pagamentos (id INT, cartao_numero VARCHAR(19), valor DECIMAL(10,2));`;

const relatorio = (opcoes = {}) => gerarRelatorio(analisarDdl(DDL).analise, opcoes);

describe("relatório: honestidade dos campos", () => {
  it("finalidade sai vazia e retenção sai 'a definir pelo controlador', nunca um prazo", () => {
    for (const l of relatorio().linhas) {
      expect(l.finalidade).toBe("");
      expect(l.retencao).toBe(RETENCAO_PADRAO);
      expect(l.retencao).not.toMatch(/\d|ano|mes|mês|dia/i);
    }
  });

  it("o que o usuário preenche entra no relatório", () => {
    const r = relatorio({
      preenchimentos: { "clientes.cpf": { finalidade: "Emitir nota fiscal", retencao: "5 anos (obrigação fiscal, a confirmar)" } },
    });
    const l = r.linhas.find((x) => x.tabela === "clientes" && x.coluna === "cpf")!;
    expect(l.finalidade).toBe("Emitir nota fiscal");
    expect(l.retencao).toMatch(/5 anos/);
  });

  it("preenchimento em branco não apaga o padrão", () => {
    const r = relatorio({ preenchimentos: { "clientes.cpf": { finalidade: "  ", retencao: "" } } });
    const l = r.linhas.find((x) => x.coluna === "cpf")!;
    expect(l.finalidade).toBe("");
    expect(l.retencao).toBe(RETENCAO_PADRAO);
  });

  it("base legal de coluna pessoal é sempre hipótese", () => {
    for (const l of relatorio().linhas.filter((x) => x.pessoal !== "nao")) expect(l.baseLegal).toMatch(/^Hipótese:/);
  });

  it("carrega o aviso de que não é parecer jurídico", () => {
    expect(relatorio().aviso).toBe(AVISO);
    expect(AVISO).toMatch(/Não é parecer jurídico/);
    expect(AVISO).toMatch(/não é IA/);
  });

  it("sem data informada, não inventa uma", () => {
    expect(relatorio().geradoEm).toBeNull();
    expect(relatorio({ geradoEm: "2026-01-02" }).geradoEm).toBe("2026-01-02");
  });

  it("correção manual aparece no relatório com origem 'manual'", () => {
    const analise = analisarDdl(DDL, { "clientes.observacao": { categoria: "sensivel", subtipo: "saude" } }).analise;
    const r = gerarRelatorio(analise);
    const l = r.linhas.find((x) => x.coluna === "observacao")!;
    expect(l).toMatchObject({ origem: "manual", sensivel: true, subtipo: "saude" });
    expect(resumir(r).corrigidasAMao).toBe(1);
    expect(paraMarkdown(r)).toMatch(/\(manual\)/);
  });

  it("resumo conta certo", () => {
    const s = resumir(relatorio());
    expect(s.tabelas).toBe(3);
    expect(s.colunas).toBe(12);
    expect(s.sensiveis).toBeGreaterThanOrEqual(1);
    expect(s.altoRisco).toBeGreaterThanOrEqual(1);
  });
});

describe("exportação JSON", () => {
  it("ida e volta devolve exatamente o mesmo relatório", () => {
    const r = relatorio({ preenchimentos: { "clientes.cpf": { finalidade: "Nota fiscal" } } });
    const volta = deJson(paraJson(r));
    expect(volta).toEqual({ ok: true, relatorio: r });
  });

  it("rejeita lixo sem lançar exceção", () => {
    for (const t of ["", "{", "null", "[]", "42", '"x"', '{"versao":99}', '{"versao":1}', '{"versao":1,"regras":"a","aviso":"b","geradoEm":null,"linhas":[{}],"achados":[]}']) {
      const r = deJson(t);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.erro.length).toBeGreaterThan(5);
    }
  });

  it("propriedade: entrada qualquer nunca lança", () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.json(), fc.string({ unit: "binary" })), (t) => {
        const r = deJson(t);
        expect(typeof r.ok).toBe("boolean");
      }),
      { numRuns: 400 },
    );
  });

  it("propriedade: exportar e importar devolve o mesmo conteúdo, com texto arbitrário nos campos", () => {
    const texto = fc.string({ maxLength: 40 });
    fc.assert(
      fc.property(texto, texto, texto, (finalidade, retencao, nota) => {
        const base = relatorio();
        const linhas = base.linhas.map((l, i) =>
          i % 3 === 0 ? { ...l, finalidade, retencao, nota: nota || null, motivo: nota } : l,
        );
        const r: Relatorio = { ...base, linhas };
        expect(deJson(paraJson(r))).toEqual({ ok: true, relatorio: r });
      }),
      { numRuns: 300 },
    );
  });
});

function linhaComNomes(tabela: string, coluna: string): LinhaRelatorio {
  return { ...relatorio().linhas[0]!, tabela, coluna, motivo: coluna, finalidade: coluna };
}

/** Leitor mínimo de CSV para os testes. */
function lerCsv(texto: string): string[][] {
  const linhas: string[][] = [];
  let celula = "";
  let linha: string[] = [];
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]!;
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') {
        celula += '"';
        i++;
      } else if (c === '"') aspas = false;
      else celula += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") {
      linha.push(celula);
      celula = "";
    } else if (c === "\r" && texto[i + 1] === "\n") {
      linha.push(celula);
      linhas.push(linha);
      linha = [];
      celula = "";
      i++;
    } else celula += c;
  }
  if (celula !== "" || linha.length) {
    linha.push(celula);
    linhas.push(linha);
  }
  return linhas;
}

describe("exportação CSV: saída segura", () => {
  it("prefixa células que começam com = + - @ tab ou CR", () => {
    for (const perigoso of ["=1+1", "+cmd", "-2", "@SUM(A1)", "\tx", "\rx"]) {
      expect(celulaCsv(perigoso).replace(/^"/, "")).toMatch(/^'/);
    }
    expect(celulaCsv("normal")).toBe("normal");
    expect(celulaCsv('com "aspas", e vírgula')).toBe('"com ""aspas"", e vírgula"');
    expect(celulaCsv("linha1\nlinha2")).toBe('"linha1\nlinha2"');
  });

  it("nomes maliciosos de tabela e coluna não viram fórmula", () => {
    const r: Relatorio = { ...relatorio(), linhas: [linhaComNomes("=HYPERLINK(\"http://x\")", "@cmd|' /C calc'!A0")] };
    const linhas = lerCsv(paraCsv(r));
    expect(linhas).toHaveLength(2);
    for (const cel of linhas[1]!) expect(cel).not.toMatch(/^[=+\-@\t\r]/);
  });

  it("propriedade: nenhuma célula exportada começa com caractere de fórmula, e o número de colunas é fixo", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 30 }), fc.string({ maxLength: 30 }), (t, c) => {
        const r: Relatorio = { ...relatorio(), linhas: [linhaComNomes(t, c)] };
        const linhas = lerCsv(paraCsv(r));
        expect(linhas.length).toBe(2);
        expect(linhas[1]!.length).toBe(linhas[0]!.length);
        for (const cel of linhas[1]!) expect(cel).not.toMatch(/^[=+\-@\t\r]/);
      }),
      { numRuns: 500 },
    );
  });

  it("tem cabeçalho e CRLF", () => {
    const csv = paraCsv(relatorio());
    expect(csv.startsWith("tabela,coluna,tipo_sql,categoria,")).toBe(true);
    expect(csv.endsWith("\r\n")).toBe(true);
  });
});

describe("exportação Markdown: saída segura", () => {
  it("escapa pipe, quebra de linha e HTML nos nomes", () => {
    expect(escMd("a|b")).toBe("a\\|b");
    expect(escMd("a\nb\r\nc")).toBe("a b  c");
    expect(escMd("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(escMd("[x](javascript:alert(1))")).toBe("\\[x\\](javascript:alert(1))");
  });

  it("um nome de tabela com HTML e pipe não quebra a tabela nem injeta tag", () => {
    const r: Relatorio = { ...relatorio(), linhas: [linhaComNomes("t|<img src=x onerror=alert(1)>", "c\n|d")] };
    const md = paraMarkdown(r);
    expect(md).not.toMatch(/<img/);
    const linha = md.split("\n").find((l) => l.includes("&lt;img"))!;
    expect(linha.match(/(?<!\\)\|/g)!.length).toBe(11); // 10 colunas = 11 barras sem escape
  });

  it("propriedade: cada linha da tabela mantém 11 barras sem escape, com nomes arbitrários", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 30 }), fc.string({ maxLength: 30 }), (t, c) => {
        const r: Relatorio = { ...relatorio(), linhas: [linhaComNomes(t, c)] };
        const linhasTabela = paraMarkdown(r)
          .split("\n")
          .filter((l) => l.startsWith("| ") && !l.startsWith("| Tabela") && !l.startsWith("|---"));
        expect(linhasTabela).toHaveLength(1);
        expect(linhasTabela[0]!.match(/(?<!\\)\|/g)!.length).toBe(11);
        expect(paraMarkdown(r)).not.toMatch(/<(?!\/?blockquote)[a-z]/i);
      }),
      { numRuns: 300 },
    );
  });

  it("traz aviso, resumo, tabela e achados", () => {
    const md = paraMarkdown(relatorio());
    expect(md).toMatch(/Não é parecer jurídico/);
    expect(md).toMatch(/\*\*Resumo:\*\*/);
    expect(md).toMatch(/## Achados do schema/);
    expect(md).toMatch(/_a preencher_/);
    expect(md).toMatch(/a definir pelo controlador/);
  });
});
