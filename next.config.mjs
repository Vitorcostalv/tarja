/** Export estático: sem servidor. Os headers de segurança ficam no vercel.json. */
const config = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
};
export default config;
