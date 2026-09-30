import { verificarPadroes, type OpcoesPadroes, type ResultadoPadroes } from "../lib/ddl/verificar";

/**
 * Worker dos Padrões de DDL (v2): a interface nunca trava. Só fala por postMessage com a página;
 * a CSP com connect-src 'none' garante que não há rede.
 */
export interface PedidoPadroes {
  id: number;
  ddl: string;
  opcoes: OpcoesPadroes;
}
export interface RespostaPadroes {
  id: number;
  resultado: ResultadoPadroes;
}

interface EscopoDoWorker {
  onmessage: ((e: MessageEvent<PedidoPadroes>) => void) | null;
  postMessage(mensagem: RespostaPadroes): void;
}
const escopo = self as unknown as EscopoDoWorker;

escopo.onmessage = (e) => {
  const { id, ddl, opcoes } = e.data;
  escopo.postMessage({ id, resultado: verificarPadroes(ddl, opcoes) });
};
