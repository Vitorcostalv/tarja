import { analisar, type Correcoes } from "../lib/lgpd/analyze";
import { parseDdl } from "../lib/sql/parser";
import type { Analise } from "../lib/lgpd/types";
import type { ParseResult } from "../lib/sql/types";

/**
 * Worker de análise: a interface nunca trava, mesmo com 1 MB de DDL ou CPU lenta.
 * Fala só por postMessage com a página: não tem acesso a rede (a CSP com connect-src 'none' garante).
 * Guarda o último parse: corrigir uma coluna à mão reanalisa sem ler o DDL de novo.
 */
export interface PedidoAnalise {
  id: number;
  ddl: string;
  correcoes: Correcoes;
}
export interface RespostaAnalise {
  id: number;
  parse: ParseResult;
  analise: Analise;
}

interface EscopoDoWorker {
  onmessage: ((e: MessageEvent<PedidoAnalise>) => void) | null;
  postMessage(mensagem: RespostaAnalise): void;
}
const escopo = self as unknown as EscopoDoWorker;

let ultimoDdl: string | null = null;
let ultimoParse: ParseResult | null = null;

escopo.onmessage = (e) => {
  const { id, ddl, correcoes } = e.data;
  if (ultimoParse === null || ultimoDdl !== ddl) {
    ultimoParse = parseDdl(ddl);
    ultimoDdl = ddl;
  }
  escopo.postMessage({ id, parse: ultimoParse, analise: analisar(ultimoParse, correcoes) });
};
