import { defineConfig } from "vitest/config";

// Suíte lenta: corpus completo, entrada de 1 MB, propriedades pesadas e cobertura com limite mínimo.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    testTimeout: 60_000,
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/**/types.ts"],
      reporter: ["text-summary", "text"],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 },
    },
  },
});
