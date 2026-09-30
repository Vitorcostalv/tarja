"use client";

import { useEffect, useRef, useState } from "react";
import { analisarDdl, type Correcoes } from "../lib/lgpd/analyze";
import type { Analise } from "../lib/lgpd/types";
import type { ParseResult } from "../lib/sql/types";
import type { RespostaAnalise } from "../workers/analise.worker";

export interface EstadoAnalise {
  pronto: boolean;
  parse: ParseResult | null;
  analise: Analise | null;
}

/**
 * Analisa o DDL em um Web Worker. Se o navegador não criar o worker, cai para a thread principal
 * (mais lento, mas funciona). O schema só existe na memória desta aba.
 */
export function useAnalise(ddl: string | null, correcoes: Correcoes): EstadoAnalise {
  const [estado, setEstado] = useState<EstadoAnalise>({ pronto: true, parse: null, analise: null });
  const worker = useRef<Worker | null>(null);
  const pedido = useRef(0);

  useEffect(() => {
    try {
      const w = new Worker(new URL("../workers/analise.worker.ts", import.meta.url));
      worker.current = w;
      w.onmessage = (e: MessageEvent<RespostaAnalise>) => {
        if (e.data.id !== pedido.current) return; // resposta velha
        setEstado({ pronto: true, parse: e.data.parse, analise: e.data.analise });
      };
      w.onerror = () => {
        worker.current = null;
      };
    } catch {
      worker.current = null;
    }
    return () => {
      worker.current?.terminate();
      worker.current = null;
    };
  }, []);

  useEffect(() => {
    if (ddl === null || ddl.trim() === "") {
      pedido.current++;
      setEstado({ pronto: true, parse: null, analise: null });
      return;
    }
    const id = ++pedido.current;
    setEstado((e) => ({ ...e, pronto: false }));
    const w = worker.current;
    if (w) {
      w.postMessage({ id, ddl, correcoes });
      return;
    }
    // Sem worker: roda aqui, depois de pintar o estado "analisando".
    const t = setTimeout(() => {
      if (id !== pedido.current) return;
      const r = analisarDdl(ddl, correcoes);
      setEstado({ pronto: true, parse: r.parse, analise: r.analise });
    }, 0);
    return () => clearTimeout(t);
  }, [ddl, correcoes]);

  return estado;
}
