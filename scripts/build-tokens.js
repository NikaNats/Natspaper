#!/usr/bin/env node
/**
 * DTCG 2025.10 Design Tokens Compiler for Natspaper
 *
 * Converts tokens/design-tokens.tokens.json into the CSS custom properties
 * consumed by src/styles/global.css (the @theme inline mapping turns them
 * into Tailwind utilities).
 *
 * Implements:
 * - DTCG alias resolution ({group.token} references) with cycle detection
 * - Composite type serialization (dimension, color, shadow, fontFamily)
 * - Deterministic output; the semantic variable-name contract is explicit
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const rootDir = path.resolve(path.dirname(currentFile), "..");
const tokenFilePath = path.join(rootDir, "tokens", "design-tokens.tokens.json");
const outputCssPath = path.join(
  rootDir,
  "src",
  "styles",
  "tokens.generated.css"
);

/**
 * Semantic tokens -> the exact CSS custom property names the stylesheet
 * contract consumes. Registering every semantic token here keeps the
 * generated output aligned with the existing variables (--foreground,
 * --code-bg, --accent, ...) instead of leaking DTCG group names into the
 * cascade, and makes adding a token a deliberate, reviewed act.
 */
const SEMANTIC_VAR_NAMES = {
  "surface.background": "--background",
  "surface.muted": "--muted",
  "surface.border": "--border",
  "surface.codeBg": "--code-bg",
  "text.primary": "--foreground",
  "text.secondary": "--text-secondary",
  "accent.default": "--accent",
};

/**
 * Serialize a DTCG color value (hex form or colorSpace/components form).
 */
function colorToCss(val) {
  if (val && typeof val === "object" && "hex" in val) {
    return val.hex;
  }
  if (val && typeof val === "object" && "components" in val) {
    const [r, g, b] = val.components.map((c) => Math.round(c * 255));
    const alpha = val.alpha !== undefined ? val.alpha : 1;
    return alpha < 1
      ? `rgba(${r}, ${g}, ${b}, ${alpha})`
      : `rgb(${r}, ${g}, ${b})`;
  }
  return val;
}

export function compileTokens(sourceJson) {
  const root =
    typeof sourceJson === "string" ? JSON.parse(sourceJson) : sourceJson;

  function resolveAlias(ref, visited) {
    if (typeof ref !== "string" || !ref.startsWith("{") || !ref.endsWith("}")) {
      return ref;
    }

    if (visited.has(ref)) {
      throw new Error(
        `[DTCG 2025.10] Circular reference detected: ${Array.from(visited).join(" -> ")} -> ${ref}`
      );
    }
    visited.add(ref);

    let current = root;
    for (const part of ref.slice(1, -1).split(".")) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        throw new Error(`[DTCG 2025.10] Unresolvable token reference: ${ref}`);
      }
    }

    if (current && typeof current === "object" && "$value" in current) {
      return resolveValue(current, visited);
    }
    throw new Error(`[DTCG 2025.10] Reference target is not a token: ${ref}`);
  }

  function resolveValue(node, visited = new Set()) {
    const val = node.$value;

    if (typeof val === "string" && val.startsWith("{")) {
      return resolveAlias(val, visited);
    }

    if (Array.isArray(val)) {
      // DTCG fontFamily: quote multi-word family names
      return val.map((f) => (f.includes(" ") ? `"${f}"` : f)).join(", ");
    }

    if (val && typeof val === "object") {
      // DTCG dimension type
      if ("value" in val && "unit" in val) {
        return `${val.value}${val.unit}`;
      }

      // DTCG color types (hex form and colorSpace/components form)
      if ("hex" in val || "components" in val) {
        return colorToCss(val);
      }

      // DTCG shadow composite type
      if ("blur" in val && "offsetX" in val && "offsetY" in val) {
        const offsetX = `${val.offsetX.value}${val.offsetX.unit}`;
        const offsetY = `${val.offsetY.value}${val.offsetY.unit}`;
        const blur = `${val.blur.value}${val.blur.unit}`;
        const spread = val.spread
          ? `${val.spread.value}${val.spread.unit}`
          : "0px";
        const color = colorToCss(val.color);
        const inset = val.inset ? "inset " : "";
        return `${inset}${offsetX} ${offsetY} ${blur} ${spread} ${color}`;
      }
    }

    return val;
  }

  function emitTheme(theme) {
    const lines = [];
    const groups = root.semantic?.[theme] ?? {};
    for (const [group, tokens] of Object.entries(groups)) {
      for (const [name, token] of Object.entries(tokens)) {
        // Reserved $-prefixed properties ($type, $description, ...) are group
        // metadata, not tokens — the DTCG schema reserves all "$" names.
        if (name.startsWith("$")) continue;
        const varName = SEMANTIC_VAR_NAMES[`${group}.${name}`];
        if (!varName) {
          throw new Error(
            `[DTCG 2025.10] Unmapped semantic token "${group}.${name}": register its CSS variable in SEMANTIC_VAR_NAMES in scripts/build-tokens.js`
          );
        }
        lines.push(`  ${varName}: ${resolveValue(token)};`);
      }
    }
    return lines;
  }

  const lightVars = emitTheme("light");
  const darkVars = emitTheme("dark");

  return `/* Auto-generated by scripts/build-tokens.js from tokens/design-tokens.tokens.json (DTCG 2025.10). DO NOT EDIT. */

:root {
${lightVars.join("\n")}
}

html[data-theme="dark"] {
${darkVars.join("\n")}
}
`;
}

// CLI execution (skipped when imported by tests)
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === currentFile
) {
  try {
    const rawTokens = fs.readFileSync(tokenFilePath, "utf8");
    const outputCss = compileTokens(rawTokens);
    fs.writeFileSync(outputCssPath, outputCss, "utf8");
    console.log(
      "✅ [DTCG 2025.10] Compiled design tokens -> src/styles/tokens.generated.css"
    );
  } catch (err) {
    console.error("❌ [DTCG 2025.10] Compilation failed:", err.message);
    process.exit(1);
  }
}
