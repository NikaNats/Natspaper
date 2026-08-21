import type { AstroIntegration } from "astro";
import fs from "node:fs";
import path from "node:path";

/**
 * Finalize the dist/ output after a static build.
 *
 * Static hosts (Vercel, Netlify, GitHub Pages, nginx `error_page`) look for
 * a root-level `404.html`. Astro's default directory URL format emits the
 * root not-found page as `dist/404/index.html`, which those hosts never
 * consult. This integration copies it to `dist/404.html` so the branded
 * bilingual 404 is served for unmatched routes.
 */
export function finalizeDistIntegration(): AstroIntegration {
  return {
    name: "finalize-dist",
    hooks: {
      "astro:build:done": ({ logger }) => {
        const outDir = path.resolve(process.cwd(), "dist");
        const source = path.join(outDir, "404", "index.html");
        const target = path.join(outDir, "404.html");

        if (fs.existsSync(source)) {
          fs.copyFileSync(source, target);
          logger.info("Copied dist/404/index.html → dist/404.html");
        } else if (!fs.existsSync(target)) {
          logger.warn(
            "No root 404 page found (expected dist/404/index.html); static hosts will serve their default error page."
          );
        }
      },
    },
  };
}
