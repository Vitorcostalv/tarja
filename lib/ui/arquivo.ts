/**
 * Compartilhar o resultado é por arquivo: nada de link com o schema dentro.
 * O arquivo é gerado no navegador e baixado por um link local (blob:), sem nenhuma requisição.
 */
export function baixarArquivo(nome: string, conteudo: string, tipo: string, comBom = false): void {
  const partes = comBom ? ["﻿", conteudo] : [conteudo];
  const blob = new Blob(partes, { type: `${tipo};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
