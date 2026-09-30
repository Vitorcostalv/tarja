"use client";

import { useEffect, useRef, useState } from "react";
import { verificarPadroes, type OpcoesPadroes, type ResultadoPadroes } from "../lib/ddl/verificar";
import type { RespostaPadroes } from "../workers/padroes.worker";

export interface EstadoPadroes {
  pronto: boolean;
  resultado: ResultadoPadroes | null;
}

/** Verifica os Padrões de DDL (v2) num Web Worker; sem worker, cai para a thread principal. */
export function usePadroes(ddl: string | null, opcoes: OpcoesPadroes): EstadoPadroes {
  const [estado, setEstado] = useState<EstadoPadroes>({ pronto: true, resultado: null });
  const worker = useRef<Worker | null>(null);
  const pedido = useRef(0);
  const [falhas, setFalhas] = useState(0);

  useEffect(() => {
    try {
      const w = new Worker(new URL("../workers/padroes.worker.ts", import.meta.url));
      worker.current = w;
      w.onmessage = (e: MessageEvent<RespostaPadroes>) => {
        if (e.data.id !== pedido.current) return;
        setEstado({ pronto: true, resultado: e.data.resultado });
      };
      w.onerror = () => {
        worker.current?.terminate();
        worker.current = null;
        setFalhas((n) => n + 1);
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
      setEstado({ pronto: true, resultado: null });
      return;
    }
    const id = ++pedido.current;
    setEstado((e) => ({ ...e, pronto: false }));
    const w = worker.current;
    if (w) {
      w.postMessage({ id, ddl, opcoes });
      return;
    }
    const t = setTimeout(() => {
      if (id !== pedido.current) return;
      setEstado({ pronto: true, resultado: verificarPadroes(ddl, opcoes) });
    }, 0);
    return () => clearTimeout(t);
  }, [ddl, opcoes, falhas]);

  return estado;
}
