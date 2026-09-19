import type { AstroIntegration } from "astro";
import fs from "node:fs";
import path from "node:path";

const MATHML_CORE_ELEMENTS = new Set([
  "math",
  "mrow",
  "mi",
  "mn",
  "mo",
  "ms",
  "mspace",
  "mtext",
  "mfrac",
  "msqrt",
  "mroot",
  "mstyle",
  "merror",
  "mpadded",
  "mphantom",
  "msub",
  "msup",
  "msubsup",
  "munder",
  "mover",
  "munderover",
  "mmultiscripts",
  "mtable",
  "mtr",
  "mtd",
  "maction",
  "annotation",
  "semantics",
]);

export function validateMathMLIntegration(): AstroIntegration {
  return {
    name: "validate-mathml",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        let outDirPath = dir.pathname;
        // Windows: file URL pathname like /C:/... -> C:/...
        const winMatch = outDirPath.match(/^\/([A-Z]:\/.*)/);
        if (winMatch) outDirPath = winMatch[1]!;
        const scanHtml = (currentPath: string) => {
          let entries: fs.Dirent[];
          try {
            entries = fs.readdirSync(currentPath, { withFileTypes: true });
          } catch {
            return;
          }
          for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
              scanHtml(fullPath);
            } else if (entry.isFile() && entry.name.endsWith(".html")) {
              const html = fs.readFileSync(fullPath, "utf-8");
              if (!html.includes("<math")) continue;
              // Lightweight tag scan without extra deps: find tags inside <math>…</math>
              const mathBlocks = html.match(/<math[\s\S]*?<\/math>/gi) || [];
              for (const block of mathBlocks) {
                const tags =
                  block.match(/<\/?([a-zA-Z][a-zA-Z0-9-]*)[^>]*>/g) || [];
                for (const tagStr of tags) {
                  const m = tagStr.match(/<\/?([a-zA-Z][a-zA-Z0-9-]*)/);
                  if (!m) continue;
                  const tag = m[1]!.toLowerCase();
                  if (!MATHML_CORE_ELEMENTS.has(tag)) {
                    logger.warn(
                      `Non-MathML Core element detected in ${path.relative(outDirPath, fullPath)}: <${tag}>`
                    );
                  }
                }
              }
            }
          }
        };
        scanHtml(outDirPath);
      },
    },
  };
}
