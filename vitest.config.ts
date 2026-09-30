import { defineConfig } from "vitest/config";

// Suíte rápida: roda em todo commit. O corpus completo e a cobertura ficam em vitest.slow.config.ts.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/**/*.slow.test.{ts,tsx}", "node_modules/**"],
    environment: "node",
  },
});
