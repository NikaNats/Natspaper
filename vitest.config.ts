import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@tests": path.resolve(import.meta.dirname, "./tests"),
      // Astro virtual modules are not available in the Vitest environment.
      // These stubs provide the minimum surface area required by source files
      // under test.  Extend the stub files if new imports are needed.
      "astro:content": path.resolve(
        import.meta.dirname,
        "./tests/__mocks__/astro-content.ts"
      ),
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
    exclude: ["tests/e2e-browser/**", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      // Scope = unit-testable logic. Astro routes (src/pages), build
      // integrations and the Satori OG template are build/runtime glue that
      // the production build and Playwright E2E gates exercise instead;
      // counting them here made the threshold unreachable, so it was never
      // enforced at all.
      include: ["src/utils/**/*.ts", "src/i18n/**/*.ts"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.d.ts",
        "src/utils/og/templates/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
