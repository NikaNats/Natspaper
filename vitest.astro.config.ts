import { getViteConfig } from "astro/config";
import path from "node:path";

// Component tests render .astro files through the Astro Container API, which
// needs Astro's own Vite plugins (unlike the plain unit-test config).
export default getViteConfig({
  resolve: {
    alias: { "@tests": path.resolve(import.meta.dirname, "./tests") },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/component/**/*.test.ts"],
  },
} as Parameters<typeof getViteConfig>[0]);
