"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Correcoes } from "../lib/lgpd/analyze";
import { paraCsv, paraJson, paraMarkdown } from "../lib/lgpd/export";
import { fraseDeDesempenho } from "../lib/lgpd/medicao";
import type { Correcao } from "../lib/lgpd/manual";
import { colunasSemClassificacao, gerarRelatorio, resumir, rotuloCategoria } from "../lib/lgpd/report";
import { AVISO } from "../lib/lgpd/report";
import { FONTES } from "../lib/lgpd/rules/fontes";
import type { Achado } from "../lib/lgpd/types";
import { SCHEMA_EXEMPLO } from "../lib/exemplo";
import { INPUT_TOO_BIG_MESSAGE, LIMITS, utf8ByteLength } from "../lib/limits";
import { baixarArquivo } from "../lib/ui/arquivo";
import { LINKS } from "../lib/ui/links";
import { Coluna, type Preenchimento } from "./Coluna";
import { useAnalise } from "./useAnalise";

const VAZIO: Preenchimento = { finalidade: "", retencao: "" };
const chave = (t: string, c: string) => `${t}.${c}`;
const ROTULO_GRAVIDADE = { alta: "Alta", media: "Média", baixa: "Baixa", informativo: "Informativo" } as const;

function dataDeHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export function Tarja() {
  const [texto, setTexto] = useState("");
  const [analisado, setAnalisado] = useState<string | null>(null);
  const [erroTamanho, setErroTamanho] = useState(false);
  const [correcoes, setCorrecoes] = useState<Correcoes>({});
  const [preench, setPreench] = useState<Record<string, Preenchimento>>({});
  const [abertas, setAbertas] = useState<ReadonlySet<string>>(new Set());
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);
  const resultadoRef = useRef<HTMLDivElement>(null);

  const { pronto, parse, analise } = useAnalise(analisado, correcoes);

  const relatorio = useMemo(
    () => (analise ? gerarRelatorio(analise, { geradoEm: dataDeHoje(), preenchimentos: preench }) : null),
    [analise, preench],
  );
  const resumo = relatorio ? resumir(relatorio) : null;
  const semPista = useMemo(() => (analise ? colunasSemClassificacao(analise) : []), [analise]);

  const analisar = useCallback((ddl: string) => {
    if (utf8ByteLength(ddl) > LIMITS.maxInputBytes) {
      setErroTamanho(true);
      setAnalisado(null);
      return;
    }
    setErroTamanho(false);
    setCorrecoes({});
    setAbertas(new Set());
    setAnalisado(ddl);
  }, []);

  const usarExemplo = () => {
    setTexto(SCHEMA_EXEMPLO);
    analisar(SCHEMA_EXEMPLO);
    setTimeout(() => resultadoRef.current?.focus(), 50);
  };
  const limpar = () => {
    setTexto("");
    setAnalisado(null);
    setErroTamanho(false);
    setCorrecoes({});
    setPreench({});
    setAbertas(new Set());
  };

  const alternar = (k: string) =>
    setAbertas((atual) => {
      const n = new Set(atual);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  const corrigir = (k: string, c: Correcao) => setCorrecoes((atual) => ({ ...atual, [k]: c }));
  const desfazer = (k: string) =>
    setCorrecoes((atual) => {
      const { [k]: _removida, ...resto } = atual;
      return resto;
    });

  const exportar = (formato: "md" | "csv" | "json") => {
    if (!relatorio) return;
    if (formato === "md") baixarArquivo("tarja-mapeamento.md", paraMarkdown(relatorio), "text/markdown");
    if (formato === "csv") baixarArquivo("tarja-mapeamento.csv", paraCsv(relatorio), "text/csv", true);
    if (formato === "json") baixarArquivo("tarja-mapeamento.json", paraJson(relatorio), "application/json");
  };

  const achadosDa = (tabela: string): Achado[] => (analise ? analise.achados.filter((a) => a.tabela === tabela) : []);

  return (
    <div className="pagina">
      <header className="cabecalho">
        <p className="rotulo sem-margem">
          Apoio à LGPD · MySQL · roda no seu navegador
        </p>
        <h1>
          <span className="titulo-marca">Tarja</span>
        </h1>
        <p className="sub">Raio-X de LGPD para schemas SQL</p>
        <div className="aviso" role="note">
          <ul>
            <li>
              <strong>Isto é apoio, não parecer jurídico.</strong> Não substitui advogado nem DPO.
            </li>
            <li>
              <strong>Regras, não IA.</strong> Dá para auditar cada decisão: todas têm motivo e fonte.
            </li>
            <li>
              <strong>Nada sai do seu navegador.</strong> Sem servidor, sem conta, sem rastreamento. <a href="#como-verificar">Como conferir</a>.
            </li>
          </ul>
        </div>
      </header>

      <main>
        <section className="entrada entrada-topo nao-imprimir" aria-labelledby="titulo-entrada">
          <label htmlFor="ddl" id="titulo-entrada">
            <span className="rotulo">1 · Cole o CREATE TABLE (só MySQL)</span>
          </label>
          <textarea
            id="ddl"
            spellCheck={false}
            autoComplete="off"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") analisar(texto);
            }}
            placeholder={"CREATE TABLE clientes (\n  id INT PRIMARY KEY,\n  nome VARCHAR(100),\n  cpf CHAR(11)\n);"}
            aria-describedby="ajuda-entrada"
          />
          <p id="ajuda-entrada" className="nota">
            Aceita várias tabelas, crases, comentários e COMMENT de coluna. Fica de fora: ALTER TABLE, views, triggers e outros bancos. Limite de 1 MB. Ctrl+Enter analisa.
          </p>
          <div className="acoes">
            <button type="button" className="botao botao-principal" onClick={() => analisar(texto)} disabled={texto.trim() === ""}>
              Analisar
            </button>
            <button type="button" className="botao" onClick={usarExemplo}>
              Usar schema de exemplo
            </button>
            <button type="button" className="botao" onClick={limpar} disabled={texto === "" && analisado === null}>
              Limpar
            </button>
          </div>
          {erroTamanho ? (
            <p className="mensagem" role="alert">
              <strong>Entrada grande demais.</strong> {INPUT_TOO_BIG_MESSAGE}
            </p>
          ) : null}
        </section>

        <div ref={resultadoRef} tabIndex={-1} aria-live="polite" aria-busy={!pronto} className="resultado">
          {analisado !== null && !pronto ? <p className="mensagem">Analisando…</p> : null}

          {parse && analise && relatorio && resumo ? (
            <>
              {parse.errors.length > 0 ? (
                <section className="mensagem" aria-label="Problemas de sintaxe">
                  <strong>
                    {parse.errors.length === 1 ? "1 trecho do SQL não foi entendido" : `${parse.errors.length} trechos do SQL não foram entendidos`}.
                  </strong>{" "}
                  Analisei o que deu.
                  <pre>
                    {parse.errors
                      .slice(0, 8)
                      .map((e) => `${e.line > 0 ? `linha ${e.line}, coluna ${e.col}: ` : ""}${e.message}${e.snippet ? `\n  ${e.snippet}` : ""}`)
                      .join("\n")}
                    {parse.errors.length > 8 ? `\n… e mais ${parse.errors.length - 8}.` : ""}
                  </pre>
                </section>
              ) : null}
              {parse.limitNotices.length > 0 ? (
                <p className="mensagem" role="status">
                  <strong>Limite atingido.</strong> {parse.limitNotices.join(" ")}
                </p>
              ) : null}
              {parse.ignored.length > 0 ? (
                <p className="mensagem" role="status">
                  <strong>Fora do escopo, ignorado:</strong>{" "}
                  {[...new Set(parse.ignored.map((i) => i.kind))].slice(0, 8).join(", ")}. A Tarja só lê CREATE TABLE.
                </p>
              ) : null}

              {parse.tables.length === 0 ? (
                <p className="mensagem">
                  <strong>Não achei nenhum CREATE TABLE.</strong> Cole o DDL de uma ou mais tabelas MySQL.
                </p>
              ) : (
                <>
                  <dl className="resumo" aria-label="Resumo do resultado">
                    <div>
                      <dt>Tabelas</dt>
                      <dd>{resumo.tabelas}</dd>
                    </div>
                    <div>
                      <dt>Colunas</dt>
                      <dd>{resumo.colunas}</dd>
                    </div>
                    <div>
                      <dt>Dado pessoal</dt>
                      <dd>{resumo.pessoais}</dd>
                    </div>
                    <div>
                      <dt>Depende</dt>
                      <dd>{resumo.dependem}</dd>
                    </div>
                    <div className="sinal">
                      <dt>Sensíveis</dt>
                      <dd>{resumo.sensiveis}</dd>
                    </div>
                    <div>
                      <dt>Alto risco (financeiro)</dt>
                      <dd>{resumo.altoRisco}</dd>
                    </div>
                    <div>
                      <dt>Sem pista: revise</dt>
                      <dd>{resumo.semClassificacao}</dd>
                    </div>
                    <div>
                      <dt>Achados</dt>
                      <dd>{resumo.achados}</dd>
                    </div>
                  </dl>

                  <p className="desempenho" role="note">
                    <strong>Quanto confiar:</strong> {fraseDeDesempenho()}
                  </p>

                  {semPista.length > 0 ? (
                    <section className="revisao nao-imprimir" aria-labelledby="titulo-revisao">
                      <h2 id="titulo-revisao">{semPista.length} {semPista.length === 1 ? "coluna sem pista: revise" : "colunas sem pista: revise"}</h2>
                      <p className="nota">
                        Nenhuma regra casou com estas. "Não identificado pelas regras" quer dizer que a Tarja não achou pista, não que não há dado pessoal. Se alguma guarda dado pessoal, marque.
                      </p>
                      <ul>
                        {semPista.slice(0, 40).map((s) => (
                          <li key={chave(s.tabela, s.coluna)}>
                            <span>
                              <span className="nome-coluna">{s.tabela}.{s.coluna}</span> <span className="tipo">{s.tipoSql}</span>
                            </span>
                            <button
                              type="button"
                              className="botao botao-mini"
                              onClick={() => {
                                corrigir(chave(s.tabela, s.coluna), { categoria: "outro_dado_pessoal" });
                                setAbertas((a) => new Set(a).add(chave(s.tabela, s.coluna)));
                              }}
                            >
                              Marcar como dado pessoal
                            </button>
                          </li>
                        ))}
                      </ul>
                      {semPista.length > 40 ? <p className="nota">… e mais {semPista.length - 40}. Elas aparecem no documento abaixo.</p> : null}
                    </section>
                  ) : null}

                  <section className="documento" aria-labelledby="titulo-doc">
                    <h2 id="titulo-doc">O documento</h2>
                    <p className="nota nao-imprimir">
                      As colunas com dado pessoal estão cobertas. Use Tab e Enter (ou clique) numa tarja para ver categoria, confiança, motivo e sugestão. Na impressão, tudo aparece.
                    </p>
                    {analise.tabelas.map((t, ti) => (
                      <article className="folha" key={t.nome}>
                        <header>
                          <h3>{t.nome}</h3>
                          <span className="rotulo">
                            {t.colunas.length} colunas ·{" "}
                            {t.contexto === "pessoa" ? "parece tabela de pessoas" : t.contexto === "nao_pessoa" ? "parece tabela de coisas ou empresas" : "contexto neutro"}
                          </span>
                        </header>
                        <ol>
                          {t.colunas.map((c, ci) => {
                            const k = chave(c.tabela, c.coluna);
                            const linha = relatorio.linhas[relatorio.linhas.findIndex((l) => l.tabela === c.tabela && l.coluna === c.coluna)];
                            return (
                              <Coluna
                                key={`${k}-${ci}`}
                                c={c}
                                semRegra={linha?.semRegra ?? false}
                                idDetalhe={`det-${ti}-${ci}`}
                                aberta={abertas.has(k)}
                                onAlternar={() => alternar(k)}
                                onCorrigir={(x) => corrigir(k, x)}
                                onDesfazer={() => desfazer(k)}
                                preenchimento={preench[k] ?? VAZIO}
                                onPreencher={(p) => setPreench((atual) => ({ ...atual, [k]: p }))}
                              />
                            );
                          })}
                        </ol>
                        {achadosDa(t.nome).length > 0 ? (
                          <div className="detalhe detalhe-achados">
                            <h4>Achados desta tabela</h4>
                            <ul>
                              {achadosDa(t.nome).map((a, i) => (
                                <li key={`${a.id}-${a.coluna ?? ""}-${i}`}>
                                  <span className={`carimbo pequeno${a.gravidade === "informativo" ? " cinza" : ""}`}>{ROTULO_GRAVIDADE[a.gravidade]}</span>{" "}
                                  <strong>{a.titulo}</strong>
                                  {a.coluna ? <> em <span className="mono">{a.coluna}</span></> : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </section>

                  {analise.achados.length > 0 ? (
                    <section className="achados" aria-labelledby="titulo-achados">
                      <h2 id="titulo-achados">Achados do schema</h2>
                      {analise.achados.map((a, i) => (
                        <article className="achado" key={`${a.id}-${a.tabela}-${a.coluna ?? ""}-${i}`}>
                          <p className="rotulo sem-margem">
                            {ROTULO_GRAVIDADE[a.gravidade]} · <span className="mono">{a.tabela}{a.coluna ? `.${a.coluna}` : ""}</span>
                          </p>
                          <h3>{a.titulo}</h3>
                          <p>{a.explicacao}</p>
                          <p className="nota">Fonte: {a.fontes.map((f) => FONTES[f]?.titulo ?? f).join("; ")}.</p>
                        </article>
                      ))}
                    </section>
                  ) : null}

                  <section className="exportar nao-imprimir" aria-labelledby="titulo-exportar">
                    <h2 id="titulo-exportar">Levar o relatório</h2>
                    <p className="nota">
                      Não existe link para compartilhar: o schema nunca vai para a URL. O compartilhamento é por arquivo. É um rascunho do inventário das operações de tratamento e insumo para o RIPD, não o documento final. Finalidade e retenção são suas.
                    </p>
                    <div className="acoes">
                      <button type="button" className="botao" onClick={() => exportar("md")}>
                        Markdown
                      </button>
                      <button type="button" className="botao" onClick={() => exportar("csv")}>
                        CSV
                      </button>
                      <button type="button" className="botao" onClick={() => exportar("json")}>
                        JSON
                      </button>
                      <button type="button" className="botao" onClick={() => window.print()}>
                        Imprimir
                      </button>
                      <button type="button" className="botao" aria-expanded={mostrarRelatorio} onClick={() => setMostrarRelatorio((v) => !v)}>
                        {mostrarRelatorio ? "Esconder a tabela do relatório" : "Ver a tabela do relatório"}
                      </button>
                    </div>
                  </section>

                  <section
                    className="relatorio"
                    aria-label="Relatório de mapeamento"
                    hidden={!mostrarRelatorio}
                  >
                    <table>
                      <caption className="so-leitor">Mapeamento de dados pessoais por coluna</caption>
                      <thead>
                        <tr>
                          <th scope="col">Tabela</th>
                          <th scope="col">Coluna</th>
                          <th scope="col">Categoria</th>
                          <th scope="col">Sensível?</th>
                          <th scope="col">Confiança</th>
                          <th scope="col">Finalidade (a preencher)</th>
                          <th scope="col">Base legal (hipótese)</th>
                          <th scope="col">Retenção</th>
                          <th scope="col">Proteção sugerida</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorio.linhas.map((l, i) => (
                          <tr key={`${l.tabela}.${l.coluna}.${i}`}>
                            <td className="mono">{l.tabela}</td>
                            <td className="mono">{l.coluna}</td>
                            <td>
                              {rotuloCategoria(l.categoria)}
                              {l.pessoal === "depende" ? " (depende)" : ""}
                              {l.origem === "manual" ? " (manual)" : ""}
                            </td>
                            <td>{l.sensivel ? "sim" : "não"}</td>
                            <td>{l.confianca === "media" ? "média" : l.confianca}</td>
                            <td>{l.finalidade || "a preencher"}</td>
                            <td>{l.baseLegal}</td>
                            <td>{l.retencao}</td>
                            <td>{l.protecao.join(" · ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                </>
              )}
            </>
          ) : null}
        </div>

        <hr className="regua nao-imprimir" />

        <section id="como-verificar" className="verificar nao-imprimir" aria-labelledby="titulo-verificar">
          <h2 id="titulo-verificar">Como verificar que nada sai do navegador</h2>
          <ol>
            <li>Abra esta página e aperte <kbd className="mono">F12</kbd> para abrir as ferramentas do navegador.</li>
            <li>Vá na aba <strong>Rede</strong> (Network). Se quiser, clique na lixeira para limpar a lista.</li>
            <li>Cole um schema, ou clique em "Usar schema de exemplo", e analise.</li>
            <li>Olhe a lista: nenhuma requisição nova aparece. A análise roda num Web Worker da própria página.</li>
            <li>
              Na aba <strong>Console</strong>, uma tentativa de chamar <span className="mono">fetch</span> para qualquer endereço de fora falha com erro de política de segurança. É a CSP da página (<span className="mono">connect-src 'none'</span>) proibindo qualquer envio para fora.
            </li>
          </ol>
          <p className="nota">
            Sem backend, sem banco, sem analytics. O schema não vai para a URL (por isso não há link de compartilhamento), e não fica salvo no navegador: fechou a aba, sumiu. O código é aberto: <a href={LINKS.repositorio}>repositório</a>.
          </p>
        </section>

        <footer className="rodape">
          <p>
            <strong>Escopo.</strong> {AVISO}
          </p>
          <p className="nota">
            Fontes: <a href={LINKS.lei}>Lei 13.709/2018 (Planalto)</a> e <a href={LINKS.anpd}>ANPD</a>. Cada regra aponta para o artigo que a sustenta, no relatório e no <a href={LINKS.repositorio}>README</a>. Só MySQL e só CREATE TABLE.
          </p>
        </footer>
      </main>
    </div>
  );
}
