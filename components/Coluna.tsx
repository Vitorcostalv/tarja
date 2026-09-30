"use client";

import type { Correcao } from "../lib/lgpd/manual";
import { FONTES } from "../lib/lgpd/rules/fontes";
import { BASE_LEGAL_POR_CATEGORIA, RETENCAO_PADRAO, TECNICAS, sugerirProtecao } from "../lib/lgpd/rules/protecao";
import { rotuloCategoria } from "../lib/lgpd/report";
import { CATEGORIAS, SUBTIPOS_SENSIVEL, type Categoria, type ClassificacaoColuna, type SubtipoSensivel } from "../lib/lgpd/types";
import { Carimbo } from "./Carimbo";

const ROTULO_SUBTIPO: Record<SubtipoSensivel, string> = {
  racial_etnica: "origem racial ou étnica",
  religiao: "convicção religiosa",
  politica: "opinião política",
  sindical: "filiação sindical ou a organização religiosa, filosófica ou política",
  saude: "saúde",
  vida_sexual: "vida sexual",
  genetico: "dado genético",
  biometrico: "dado biométrico",
};

const ROTULO_PESSOAL = { sim: "sim", nao: "não", depende: "depende" } as const;
const ROTULO_CONFIANCA = { alta: "alta", media: "média", baixa: "baixa" } as const;

export interface Preenchimento {
  finalidade: string;
  retencao: string;
}

interface Props {
  c: ClassificacaoColuna;
  semRegra: boolean;
  idDetalhe: string;
  aberta: boolean;
  onAlternar: () => void;
  onCorrigir: (correcao: Correcao) => void;
  onDesfazer: () => void;
  preenchimento: Preenchimento;
  onPreencher: (p: Preenchimento) => void;
}

export function Coluna({ c, semRegra, idDetalhe, aberta, onAlternar, onCorrigir, onDesfazer, preenchimento, onPreencher }: Props) {
  const coberta = c.pessoal !== "nao";
  const sugestoes = sugerirProtecao(c);
  const base = c.pessoal === "nao" ? null : BASE_LEGAL_POR_CATEGORIA[c.categoria];

  return (
    <li className="linha">
      <div className="linha-topo">
        {coberta ? (
          <button
            type="button"
            className={`tarja${c.sensivel ? " sensivel" : ""}`}
            aria-expanded={aberta}
            aria-controls={idDetalhe}
            onClick={onAlternar}
          >
            {c.coluna}
            {/* O nome está no DOM; isto acrescenta o que a tarja esconde dos olhos. */}
            <span className="so-leitor">
              {`, dado pessoal, ${rotuloCategoria(c.categoria)}${c.sensivel ? ", sensível" : ""}, confiança ${ROTULO_CONFIANCA[c.confianca]}`}
            </span>
          </button>
        ) : (
          <span className="nome-coluna">{c.coluna}</span>
        )}
        <span className="tipo">{c.tipoSql}</span>
        <span>
          <Carimbo c={c} semRegra={semRegra} />
          {c.pessoal === "depende" ? <> <span className="carimbo pequeno cinza">Depende</span></> : null}
          {c.origem === "manual" ? <> <span className="carimbo pequeno">Corrigida à mão</span></> : null}
        </span>
        {coberta ? (
          <span className="rotulo">Confiança {ROTULO_CONFIANCA[c.confianca]}</span>
        ) : (
          <button type="button" className="botao botao-mini" aria-expanded={aberta} aria-controls={idDetalhe} onClick={onAlternar}>
            Ver motivo
          </button>
        )}
      </div>

      {aberta ? (
        <div className="detalhe" id={idDetalhe} role="group" aria-label={`Detalhe de ${c.tabela}.${c.coluna}`}>
          <dl>
            <dt>Categoria</dt>
            <dd>
              {rotuloCategoria(c.categoria)}
              {c.subtipo ? ` (${ROTULO_SUBTIPO[c.subtipo]})` : ""}
            </dd>
            <dt>Dado pessoal?</dt>
            <dd>{ROTULO_PESSOAL[c.pessoal]}</dd>
            <dt>Sensível?</dt>
            <dd>{c.sensivel ? "sim (art. 5º, II da lei)" : "não"}</dd>
            {c.altoRisco ? (
              <>
                <dt>Risco</dt>
                <dd>alto: dado financeiro não é sensível pela lei, mas pede cuidado extra</dd>
              </>
            ) : null}
            <dt>Confiança</dt>
            <dd>{ROTULO_CONFIANCA[c.confianca]}</dd>
            <dt>Motivo</dt>
            <dd>{c.motivo}</dd>
            <dt>Fonte</dt>
            <dd>{c.fontes.map((f) => FONTES[f]?.titulo ?? f).join("; ")}</dd>
          </dl>

          {c.nota ? <p className="nota">{c.nota}</p> : null}

          {base ? (
            <div>
              <h4>Base legal (hipótese)</h4>
              <p className="nota">{base.texto} Quem decide é o controlador, com apoio jurídico.</p>
            </div>
          ) : null}

          {sugestoes.length > 0 ? (
            <div>
              <h4>Proteção sugerida</h4>
              <ul>
                {sugestoes.map((s) => (
                  <li key={s.tecnica}>
                    <strong>{TECNICAS[s.tecnica].nome}.</strong> {s.dica}
                    <details>
                      <summary>Quando faz sentido e quando não</summary>
                      <p className="nota">
                        <strong>Serve quando:</strong> {TECNICAS[s.tecnica].quando}
                      </p>
                      <p className="nota">
                        <strong>Não serve quando:</strong> {TECNICAS[s.tecnica].naoServe}
                      </p>
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {c.pessoal !== "nao" ? (
            <div className="campos">
              <label>
                <span className="rotulo">Finalidade (você preenche)</span>
                <input
                  type="text"
                  value={preenchimento.finalidade}
                  onChange={(e) => onPreencher({ ...preenchimento, finalidade: e.target.value })}
                  placeholder="Para que este dado é usado?"
                />
              </label>
              <label>
                <span className="rotulo">Retenção (você preenche)</span>
                <input
                  type="text"
                  value={preenchimento.retencao}
                  onChange={(e) => onPreencher({ ...preenchimento, retencao: e.target.value })}
                  placeholder={RETENCAO_PADRAO}
                />
              </label>
            </div>
          ) : null}

          <CorrecaoManual c={c} onCorrigir={onCorrigir} onDesfazer={onDesfazer} />
        </div>
      ) : null}
    </li>
  );
}

function CorrecaoManual({ c, onCorrigir, onDesfazer }: { c: ClassificacaoColuna; onCorrigir: (x: Correcao) => void; onDesfazer: () => void }) {
  return (
    <div className="campos">
      <label>
        <span className="rotulo">Corrigir a categoria à mão</span>
        <select
          value={c.categoria}
          onChange={(e) => {
            const categoria = e.target.value as Categoria;
            onCorrigir({ categoria, subtipo: categoria === "sensivel" ? (c.subtipo ?? "saude") : null });
          }}
        >
          {CATEGORIAS.map((cat) => (
            <option key={cat} value={cat}>
              {rotuloCategoria(cat)}
            </option>
          ))}
        </select>
      </label>
      {c.categoria === "sensivel" ? (
        <label>
          <span className="rotulo">Tipo de dado sensível</span>
          <select value={c.subtipo ?? "saude"} onChange={(e) => onCorrigir({ categoria: "sensivel", subtipo: e.target.value as SubtipoSensivel })}>
            {SUBTIPOS_SENSIVEL.map((s) => (
              <option key={s} value={s}>
                {ROTULO_SUBTIPO[s]}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {c.origem === "manual" ? (
        <div>
          <button type="button" className="botao botao-mini" onClick={onDesfazer}>
            Desfazer correção
          </button>
        </div>
      ) : null}
    </div>
  );
}
