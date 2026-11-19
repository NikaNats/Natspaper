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

function listHtmlFiles(dirPath: string): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap(entry => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
  });
}

/** Lowercased tag names used inside every <math>…</math> block of `html`. */
function collectMathTagNames(html: string): string[] {
  // Lightweight tag scan without extra deps
  const mathBlocks = html.match(/<math[\s\S]*?<\/math>/gi) ?? [];
  return mathBlocks.flatMap(block =>
    Array.from(block.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9-]*)/g), m =>
      m[1]!.toLowerCase()
    )
  );
}

export function validateMathMLIntegration(): AstroIntegration {
  return {
    name: "validate-mathml",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        let outDirPath = dir.pathname;
        // Windows: file URL pathname like /C:/... -> C:/...
        const winMatch = /^\/([A-Z]:\/.*)/.exec(outDirPath);
        if (winMatch) outDirPath = winMatch[1]!;

        for (const fullPath of listHtmlFiles(outDirPath)) {
          const html = fs.readFileSync(fullPath, "utf-8");
          if (!html.includes("<math")) continue;
          for (const tag of collectMathTagNames(html)) {
            if (!MATHML_CORE_ELEMENTS.has(tag)) {
              logger.warn(
                `Non-MathML Core element detected in ${path.relative(outDirPath, fullPath)}: <${tag}>`
              );
            }
          }
        }
      },
    },
  };
}
