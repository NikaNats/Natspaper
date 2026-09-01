// tests/unit/core/designTokens.test.ts
// Regression tests for the DTCG 2025.10 design-token pipeline: file
// conformance, alias resolution, cycle detection, and the generated CSS
// variable contract consumed by @theme inline in global.css.
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compileTokens } from "../../../scripts/build-tokens.js";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const TOKENS_PATH = path.join(ROOT, "tokens", "design-tokens.tokens.json");

describe("DTCG 2025.10 Design Tokens Format Specification", () => {
  it("conforms to the DTCG JSON file structure", () => {
    const rawContent = fs.readFileSync(TOKENS_PATH, "utf8");
    const json = JSON.parse(rawContent);

    expect(json.$schema).toContain(
      "https://www.designtokens.org/schemas/2025.10/format.json"
    );
    expect(json.primitive).toBeDefined();
    expect(json.semantic).toBeDefined();
    expect(json.semantic.light).toBeDefined();
    expect(json.semantic.dark).toBeDefined();
  });

  it("resolves alias references cleanly without circular dependencies", () => {
    const rawContent = fs.readFileSync(TOKENS_PATH, "utf8");
    const compiledCss = compileTokens(rawContent);

    expect(compiledCss).toContain("--background: #fafafa;");
    expect(compiledCss).toContain("--accent: #0066ff;");
    expect(compiledCss).toContain("--border: #e0e0e0;");

    // Dark mode semantic tokens
    expect(compiledCss).toContain('html[data-theme="dark"] {');
    expect(compiledCss).toContain("--background: #121212;");
    expect(compiledCss).toContain("--accent: #6aadff;");
  });

  it("emits the exact CSS variable contract the stylesheets consume", () => {
    const rawContent = fs.readFileSync(TOKENS_PATH, "utf8");
    const compiledCss = compileTokens(rawContent);

    // The @theme inline mapping in global.css binds to these names; a
    // generated --codeBg/--primary/--default would silently break theming.
    for (const varName of [
      "--background:",
      "--foreground:",
      "--accent:",
      "--muted:",
      "--border:",
      "--text-secondary:",
      "--code-bg:",
    ]) {
      expect(compiledCss).toContain(varName);
    }
    expect(compiledCss).toContain("--foreground: #212121;");
    expect(compiledCss).toContain("--code-bg: #f0f0f0;");
    expect(compiledCss).toMatch(
      /html\[data-theme="dark"\] \{[^}]*--foreground: #e0e0e0;/
    );
  });

  it("detects and throws on circular alias references", () => {
    // The cycle must live inside a group the compiler actually walks
    // (semantic light/dark) for the guard to be exercised.
    const invalidCircularTokens = {
      semantic: {
        light: {
          surface: {
            background: { $value: "{semantic.light.text.primary}" },
          },
          text: {
            primary: { $value: "{semantic.light.surface.background}" },
          },
        },
        dark: {},
      },
    };

    expect(() => compileTokens(invalidCircularTokens)).toThrowError(
      /Circular reference detected/
    );
  });

  it("throws on unresolvable alias paths", () => {
    const invalidMissingTokens = {
      semantic: {
        light: {
          surface: {
            background: { $value: "{primitive.color.nonexistent}" },
          },
        },
        dark: {},
      },
    };

    expect(() => compileTokens(invalidMissingTokens)).toThrowError(
      /Unresolvable token reference/
    );
  });

  it("throws on semantic tokens missing a CSS variable mapping", () => {
    const unmappedTokens = {
      semantic: {
        light: {
          surface: {
            newThing: { $value: { colorSpace: "srgb", hex: "#ffffff" } },
          },
        },
        dark: {},
      },
    };

    expect(() => compileTokens(unmappedTokens)).toThrowError(
      /Unmapped semantic token/
    );
  });
});
