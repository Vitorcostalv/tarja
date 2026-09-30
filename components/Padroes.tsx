"use client";

import { useState } from "react";
import { CATALOGO, SECOES, regraPorId, type Severidade } from "../lib/ddl/catalogo";
import { agruparPorObjeto, resumoDoResultado } from "../lib/ddl/exportar";
import type { OpcoesPadroes, ResultadoPadroes } from "../lib/ddl/verificar";

const ROTULO_SEV: Record<Severidade, string> = { erro: "Erro", aviso: "Aviso" };

/** Carimbo de severidade. Erro é cheio (tinta), aviso é vazado. Laranja NÃO é usado aqui: é só para dado sensível. */
function CarimboSeveridade({ s }: { s: Severidade }) {
  return <span className={`carimbo pequeno${s === "erro" ? " cheio" : ""}`}>{ROTULO_SEV[s]}</span>;
}

function rotuloSeveridade(r: (typeof CATALOGO)[number]): string {
  if (typeof r.severidade === "string") return r.severidade === "erro" ? "erro" : "aviso";
  return `${r.severidade.nova === "erro" ? "erro" : "aviso"} em tabela nova, ${r.severidade.legada === "erro" ? "erro" : "aviso"} em legada`;
}

/** As regras da v2, para ler antes de usar. Vêm do mesmo catálogo que o verificador usa. */
export function CatalogoDeRegras() {
  return (
    <details className="catalogo">
      <summary>Ver as regras dos Padrões de DDL (v2) ({CATALOGO.length})</summary>
      <p className="nota">
        Convenções de banco MySQL definidas pelo autor do projeto (charset latin1, multi-tenant por <span className="mono">cod_projeto</span>). Não são a LGPD, não são lei e não vêm de fonte oficial: valem para quem adota o padrão. O verificador aplica exatamente estas regras, pelo id.
      </p>
      {SECOES.map((secao) => {
        const regras = CATALOGO.filter((r) => r.secao === secao);
        if (regras.length === 0) return null;
        return (
          <section key={secao}>
            <h3 className="catalogo-secao">{secao}</h3>
            <ul>
              {regras.map((r) => (
                <li key={r.id}>
                  <p className="sem-margem">
                    <span className="mono">{r.id}</span> <strong>{r.titulo}</strong> <span className="rotulo">({rotuloSeveridade(r)})</span>
                  </p>
                  <p className="nota sem-margem">{r.explicacao}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </details>
  );
}

interface OpcoesProps {
  opcoes: OpcoesPadroes;
  onMudar: (o: OpcoesPadroes) => void;
}

export function OpcoesDosPadroes({ opcoes, onMudar }: OpcoesProps) {
  return (
    <div className="campos opcoes-padroes">
      <label>
        <span className="rotulo">Tabelas e rotinas são</span>
        <select value={opcoes.modo} onChange={(e) => onMudar({ ...opcoes, modo: e.target.value as OpcoesPadroes["modo"] })}>
          <option value="auto">Automático (latin1 = legada, utf8mb4 = nova)</option>
          <option value="nova">Novas (itens de migração viram erro)</option>
          <option value="legada">Legadas (itens de migração viram aviso)</option>
        </select>
      </label>
      <label>
        <span className="rotulo">Tabelas de extensão (opcional)</span>
        <input
          type="text"
          value={opcoes.extensoes}
          onChange={(e) => onMudar({ ...opcoes, extensoes: e.target.value })}
          placeholder="tb_site_gf:tb_site, tb_outra_ext"
        />
      </label>
    </div>
  );
}

export function ResultadoDosPadroes({ r }: { r: ResultadoPadroes }) {
  const [soErros, setSoErros] = useState(false);
  const s = resumoDoResultado(r);
  const lista = soErros ? r.violacoes.filter((v) => v.severidade === "erro") : r.violacoes;
  const grupos = agruparPorObjeto(lista);

  if (r.rejeitado) {
    return (
      <p className="mensagem" role="alert">
        <strong>Entrada grande demais.</strong> O script passa de 1 MB (medido em bytes UTF-8). Cole só o que importa ou divida em partes.
      </p>
    );
  }
  if (r.tabelas.length === 0 && r.rotinas.length === 0 && r.violacoes.length === 0) {
    return (
      <p className="mensagem">
        <strong>Não achei CREATE TABLE, CREATE PROCEDURE, FUNCTION, TRIGGER nem EVENT.</strong> Cole o DDL para verificar.
      </p>
    );
  }

  return (
    <>
      {r.leitura.errors.length > 0 ? (
        <section className="mensagem" aria-label="Problemas de sintaxe">
          <strong>{r.leitura.errors.length === 1 ? "1 trecho do SQL não foi entendido" : `${r.leitura.errors.length} trechos do SQL não foram entendidos`}.</strong> Verifiquei o que deu.
          <pre>
            {r.leitura.errors
              .slice(0, 6)
              .map((e) => `${e.line > 0 ? `linha ${e.line}: ` : ""}${e.message}${e.snippet ? `\n  ${e.snippet}` : ""}`)
              .join("\n")}
          </pre>
        </section>
      ) : null}

      <dl className="resumo" aria-label="Resumo da verificação">
        <div>
          <dt>Tabelas</dt>
          <dd>{s.tabelas}</dd>
        </div>
        <div>
          <dt>Rotinas</dt>
          <dd>{s.rotinas}</dd>
        </div>
        <div>
          <dt>Erros</dt>
          <dd>{s.erros}</dd>
        </div>
        <div>
          <dt>Avisos</dt>
          <dd>{s.avisos}</dd>
        </div>
        <div>
          <dt>Regras sem problema</dt>
          <dd>{s.semProblema}</dd>
        </div>
      </dl>

      {r.tabelas.length > 0 ? (
        <p className="nota">
          Modo assumido:{" "}
          {r.tabelas.map((t, i) => (
            <span key={`${t.nome}-${i}`}>
              <span className="mono">{t.nome}</span> ({t.perfil}, {t.modo}
              {t.modoDeduzido ? ", deduzido do charset" : ""}){i < r.tabelas.length - 1 ? "; " : "."}
            </span>
          ))}{" "}
          {r.rotinas.length > 0 ? `Rotinas: ${r.rotinas[0]?.modo}.` : ""} Você pode trocar o modo nas opções acima.
        </p>
      ) : null}

      <section className="achados" aria-labelledby="titulo-padroes">
        <h2 id="titulo-padroes">Achados</h2>
        <label className="nota nao-imprimir">
          <input type="checkbox" checked={soErros} onChange={(e) => setSoErros(e.target.checked)} /> Mostrar só erros
        </label>
        {grupos.length === 0 ? <p className="mensagem">{soErros ? "Nenhum erro." : "Nenhum achado: tudo o que foi verificado está nos padrões."}</p> : null}
        {grupos.map((g) => (
          <article className="folha" key={g.objeto}>
            <header>
              <h3>{g.objeto}</h3>
              <span className="rotulo">{g.violacoes.length} {g.violacoes.length === 1 ? "achado" : "achados"}</span>
            </header>
            <ol>
              {g.violacoes.map((v, i) => {
                const regra = regraPorId(v.regra);
                return (
                  <li className="linha" key={`${v.regra}-${i}`}>
                    <div className="detalhe-padrao">
                      <p className="sem-margem">
                        <CarimboSeveridade s={v.severidade} /> <span className="mono">{v.regra}</span> <strong>{regra?.titulo}</strong>
                        {v.linha ? <span className="rotulo"> · linha {v.linha}</span> : null}
                      </p>
                      <p className="sem-margem">{v.detalhe}</p>
                      <details>
                        <summary>Por que esta regra existe</summary>
                        <p className="nota">{regra?.explicacao}</p>
                      </details>
                    </div>
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </section>

      {r.regrasSemViolacao.length > 0 ? (
        <details className="catalogo">
          <summary>{r.regrasSemViolacao.length} regras verificadas sem problema</summary>
          <ul>
            {r.regrasSemViolacao.map((id) => (
              <li key={id}>
                <span className="mono">{id}</span> {regraPorId(id)?.titulo}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}
