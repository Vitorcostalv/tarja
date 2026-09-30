import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/source-serif-4/latin-400.css";
import "@fontsource/source-serif-4/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./globals.css";
import { SITE_URL } from "../lib/ui/links";

const DESCRICAO =
  "Cole o CREATE TABLE do MySQL e veja quais colunas guardam dado pessoal ou sensível, com sugestão de proteção e rascunho do inventário de dados. Roda no seu navegador. Regras, não IA.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Tarja: raio-X de LGPD para schemas SQL",
  description: DESCRICAO,
  // OG estática: nunca carrega dado de schema.
  openGraph: {
    title: "Tarja: raio-X de LGPD para schemas SQL",
    description: DESCRICAO,
    type: "website",
    locale: "pt_BR",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Tarja: um documento com tarja preta sobre nomes de colunas." }],
  },
  twitter: { card: "summary_large_image", title: "Tarja: raio-X de LGPD para schemas SQL", description: DESCRICAO, images: ["/og.png"] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#f3efe4", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
