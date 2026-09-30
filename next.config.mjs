/** Export estático: sem servidor. Os headers de segurança ficam no vercel.json (gerado por scripts/gerar-csp.ts). */
const config = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  // ID de build fixo: o ID entra nos scripts inline, e a CSP usa o hash deles. Com ID aleatório o hash mudaria a cada build.
  generateBuildId: async () => "tarja",
};
export default config;
