// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Tarja } from "../../components/Tarja";

/**
 * Fumaça da interface: o fluxo principal funciona, a tarja é acessível e nada vai para a rede.
 * No jsdom não há Web Worker: a análise cai para a thread principal (o mesmo código).
 */
const fetchEspiao = vi.fn();
let blobs: Blob[] = [];

beforeEach(() => {
  blobs = [];
  fetchEspiao.mockReset();
  vi.stubGlobal("fetch", fetchEspiao);
  URL.createObjectURL = vi.fn((b: Blob) => {
    blobs.push(b);
    return "blob:teste";
  });
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function abrirExemplo() {
  render(<Tarja />);
  fireEvent.click(screen.getByRole("button", { name: "Usar schema de exemplo" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "O documento" })).toBeTruthy());
}

describe("interface: aviso e honestidade", () => {
  it("diz na tela que é apoio, que são regras e que nada sai do navegador", () => {
    render(<Tarja />);
    expect(screen.getByText(/Isto é apoio, não parecer jurídico/)).toBeTruthy();
    expect(screen.getByText(/Regras, não IA\./)).toBeTruthy();
    expect(screen.getByText(/Nada sai do seu navegador/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Como verificar/ })).toBeTruthy();
  });

  it("a frase de desempenho e o aviso sobre 'sem pista' aparecem com o resultado", async () => {
    await abrirExemplo();
    expect(screen.getByText(/deixou passar cerca de 1 em cada 10 colunas com dado pessoal/)).toBeTruthy();
    expect(screen.getAllByText(/não que não há dado pessoal/).length).toBeGreaterThan(0);
  });
});

describe("interface: a tarja", () => {
  it("coluna com dado pessoal é um botão com o NOME no DOM, recolhido, e abre o detalhe", async () => {
    await abrirExemplo();
    const cpf = screen.getAllByRole("button").find((b) => b.classList.contains("tarja") && b.textContent?.startsWith("cpf"));
    expect(cpf).toBeTruthy();
    // O nome está no DOM e o botão diz a categoria para o leitor de tela.
    expect(cpf!.textContent).toMatch(/cpf, dado pessoal, Identificador direto, confiança alta/);
    expect(cpf!.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(cpf!);
    expect(cpf!.getAttribute("aria-expanded")).toBe("true");
    const painel = document.getElementById(cpf!.getAttribute("aria-controls")!)!;
    expect(within(painel).getByText(/Base legal \(hipótese\)/)).toBeTruthy();
    expect(within(painel).getByText(/Proteção sugerida/)).toBeTruthy();
    expect(within(painel).getByText(/NÃO é dado sensível|não é dado sensível/i)).toBeTruthy();
    // Fecha de novo.
    fireEvent.click(cpf!);
    expect(cpf!.getAttribute("aria-expanded")).toBe("false");
  });

  it("coluna sensível ganha a marca de sensível; só ela", async () => {
    await abrirExemplo();
    const sensiveis = document.querySelectorAll("button.tarja.sensivel");
    expect(sensiveis.length).toBeGreaterThanOrEqual(3);
    for (const b of sensiveis) expect(b.textContent).toMatch(/sensível/);
    const naoSensivel = [...document.querySelectorAll("button.tarja:not(.sensivel)")];
    for (const b of naoSensivel) expect(b.textContent).not.toMatch(/, sensível,/);
  });

  it("coluna sem dado pessoal aparece em claro, sem tarja", async () => {
    await abrirExemplo();
    const id = [...document.querySelectorAll(".nome-coluna")].find((e) => e.textContent === "id");
    expect(id).toBeTruthy();
    expect(id!.closest("button")).toBeNull();
  });

  it("corrigir à mão muda a classificação e marca como corrigida", async () => {
    await abrirExemplo();
    const botao = screen.getAllByRole("button", { name: "Marcar como dado pessoal" })[0]!;
    fireEvent.click(botao);
    await waitFor(() => expect(screen.getAllByText("Corrigida à mão").length).toBeGreaterThan(0));
  });
});

describe("interface: entrada, limite e erro", () => {
  it("acima de 1 MB em bytes UTF-8 mostra a mensagem e não analisa", async () => {
    render(<Tarja />);
    const caixa = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(caixa, { target: { value: "é".repeat(600_000) } }); // 600 mil caracteres = 1,2 MB
    fireEvent.click(screen.getByRole("button", { name: "Analisar" }));
    expect(await screen.findByText(/Entrada grande demais/)).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "O documento" })).toBeNull();
  });

  it("erro de sintaxe mostra o trecho e analisa o que deu", async () => {
    render(<Tarja />);
    const caixa = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(caixa, { target: { value: "CREATE TABLE clientes (id INT, quebrada, cpf CHAR(11));" } });
    fireEvent.click(screen.getByRole("button", { name: "Analisar" }));
    expect(await screen.findByText(/trecho do SQL não foi entendido/)).toBeTruthy();
    expect(screen.getByText(/quebrada/, { selector: "pre" })).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "O documento" })).toBeTruthy();
  });

  it("texto sem CREATE TABLE diz isso com clareza", async () => {
    render(<Tarja />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "SELECT 1;" } });
    fireEvent.click(screen.getByRole("button", { name: "Analisar" }));
    expect(await screen.findByText(/Não achei nenhum CREATE TABLE/)).toBeTruthy();
  });

  it("Limpar apaga tudo, inclusive o resultado", async () => {
    await abrirExemplo();
    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "O documento" })).toBeNull());
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("");
  });
});

describe("interface: schema grande", () => {
  it("desenha 50 tabelas de cada vez e oferece mostrar mais, sem perder nada no relatório", async () => {
    render(<Tarja />);
    const ddl = Array.from({ length: 120 }, (_, i) => `CREATE TABLE tabela_${i} (id INT, cpf CHAR(11), criado_em DATETIME);`).join("\n");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: ddl } });
    fireEvent.click(screen.getByRole("button", { name: "Analisar" }));
    await waitFor(() => expect(document.querySelectorAll("article.folha").length).toBe(50));
    expect(screen.getByText(/Mostrando 50 de 120 tabelas/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Mostrar mais 50/ }));
    await waitFor(() => expect(document.querySelectorAll("article.folha").length).toBe(100));
    // O relatório (tabela) tem as 120 × 3 colunas, independentemente do que o documento desenhou.
    expect(document.querySelectorAll(".relatorio tbody tr").length).toBe(360);
  });

  it("o leitor de tela recebe um aviso curto, não o resultado inteiro", async () => {
    await abrirExemplo();
    const status = screen.getByRole("status");
    expect(status.textContent).toMatch(/^Análise pronta: 6 tabelas, 40 colunas/);
    expect(status.textContent!.length).toBeLessThan(200);
  });
});

describe("interface: exportação e privacidade", () => {
  it("Markdown, CSV e JSON viram arquivo local (blob:), com o aviso dentro", async () => {
    await abrirExemplo();
    const clique = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    for (const nome of ["Markdown", "CSV", "JSON"]) fireEvent.click(screen.getByRole("button", { name: nome }));
    expect(blobs).toHaveLength(3);
    expect(clique).toHaveBeenCalledTimes(3);
    const textos = await Promise.all(blobs.map((b) => b.text()));
    expect(textos[0]).toMatch(/Não é parecer jurídico/);
    expect(textos[1]).toMatch(/^.?tabela,coluna,/);
    expect(JSON.parse(textos[2]!).versao).toBe(1);
    clique.mockRestore();
  });

  it("todo o fluxo (exemplo, abrir tarja, corrigir, exportar) não faz nenhuma requisição", async () => {
    await abrirExemplo();
    const tarja = document.querySelector("button.tarja") as HTMLButtonElement;
    fireEvent.click(tarja);
    fireEvent.click(screen.getAllByRole("button", { name: "Marcar como dado pessoal" })[0]!);
    const clique = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    clique.mockRestore();
    expect(fetchEspiao).not.toHaveBeenCalled();
  });

  it("o atalho #exemplo abre com o schema de exemplo (um atalho fixo, nunca schema de ninguém)", async () => {
    window.location.hash = "#exemplo";
    render(<Tarja />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "O documento" })).toBeTruthy());
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toMatch(/Clínica Exemplo/);
    window.location.hash = "";
  });

  it("o schema não vai para a URL nem para o storage", async () => {
    const antes = location.href;
    await abrirExemplo();
    expect(location.href).toBe(antes);
    expect(location.search).toBe("");
    expect(location.hash).toBe("");
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});

describe("interface: camada Padrões de DDL (v2)", () => {
  async function abrirPadroes() {
    render(<Tarja />);
    fireEvent.click(screen.getByRole("button", { name: /Padrões de DDL \(v2\)/ }));
    fireEvent.click(screen.getByRole("button", { name: "Usar script de exemplo" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Achados" })).toBeTruthy());
  }

  it("a camada começa em LGPD e o seletor troca o que a página diz", () => {
    render(<Tarja />);
    const lgpd = screen.getByRole("button", { name: /^LGPD/ });
    const v2 = screen.getByRole("button", { name: /Padrões de DDL \(v2\)/ });
    expect(lgpd.getAttribute("aria-pressed")).toBe("true");
    expect(v2.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(v2);
    expect(v2.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/Isto não é LGPD e não é lei/)).toBeTruthy();
    expect(screen.queryByText(/Isto é apoio, não parecer jurídico/)).toBeNull();
    expect(screen.getByRole("button", { name: "Verificar" })).toBeTruthy();
  });

  it("lista as regras para o usuário ler, sem nome de empresa", () => {
    render(<Tarja />);
    fireEvent.click(screen.getByRole("button", { name: /Padrões de DDL \(v2\)/ }));
    const resumo = screen.getByText(/Ver as regras dos Padrões de DDL \(v2\)/);
    expect(resumo).toBeTruthy();
    const catalogo = resumo.closest("details")!;
    expect(catalogo.textContent).toMatch(/E01/);
    expect(catalogo.textContent).toMatch(/DEFINER = root@localhost/);
    expect(catalogo.textContent).toMatch(/cod_projeto é imutável/);
    expect(catalogo.textContent).not.toMatch(/vtt|vt_/i);
    expect(catalogo.textContent).toMatch(/Não são a LGPD, não são lei/);
  });

  it("o script de exemplo mostra erros e avisos com id da regra e o porquê", async () => {
    await abrirPadroes();
    expect(document.body.textContent).toMatch(/Erros/);
    expect(document.body.textContent).toMatch(/A01/); // cod_projeto no SET
    expect(document.body.textContent).toMatch(/S01/); // definer pessoal
    expect(document.body.textContent).toMatch(/S05/); // DELETE sem archive
    expect(document.body.textContent).toMatch(/D05/); // cod_projeto com DEFAULT
    expect(screen.getAllByText("Por que esta regra existe").length).toBeGreaterThan(3);
    expect(screen.getByRole("status").textContent).toMatch(/Verificação pronta: \d+ erros e \d+ avisos/);
  });

  it("trocar o modo nas opções muda a severidade (erro em nova, aviso em legada)", async () => {
    await abrirPadroes();
    const seletor = screen.getByLabelText(/Tabelas e rotinas são/) as HTMLSelectElement;
    fireEvent.change(seletor, { target: { value: "nova" } });
    await waitFor(() => expect(document.querySelector(".carimbo.cheio")).toBeTruthy());
    const cheiosNova = document.querySelectorAll(".carimbo.cheio").length;
    fireEvent.change(seletor, { target: { value: "legada" } });
    await waitFor(() => expect(document.querySelectorAll(".carimbo.cheio").length).toBeLessThan(cheiosNova));
  });

  it("'só erros' filtra a lista", async () => {
    await abrirPadroes();
    const todos = document.querySelectorAll(".folha li.linha").length;
    fireEvent.click(screen.getByLabelText(/Mostrar só erros/));
    expect(document.querySelectorAll(".folha li.linha").length).toBeLessThan(todos);
    for (const c of document.querySelectorAll(".folha li.linha .carimbo")) expect(c.classList.contains("cheio")).toBe(true);
  });

  it("exporta Markdown e JSON sem o DDL colado, e sem tocar na rede", async () => {
    await abrirPadroes();
    const clique = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    expect(blobs).toHaveLength(2);
    const [md, json] = await Promise.all(blobs.map((b) => b.text()));
    expect(md).toMatch(/Padrões de DDL \(v2\): resultado/);
    expect(md).not.toMatch(/UPDATE app_loja|cod_pedido int(11)|DELETE FROM app_loja|valor_total double NOT NULL/); // o texto do DDL não entra no arquivo
    expect(JSON.parse(json!).versao).toBe("v2");
    expect(fetchEspiao).not.toHaveBeenCalled();
    clique.mockRestore();
  });

  it("a mesma entrada vale nas duas camadas: trocar de camada reanalisa", async () => {
    await abrirPadroes();
    fireEvent.click(screen.getByRole("button", { name: /^LGPD/ }));
    // O script de exemplo dos padrões tem tabelas; a camada LGPD as lê do mesmo texto.
    await waitFor(() => expect(screen.getByRole("heading", { name: "O documento" })).toBeTruthy());
  });
});
