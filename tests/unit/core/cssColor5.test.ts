// tests/unit/core/cssColor5.test.ts
// Regression tests for the W3C CSS Color Module Level 5 integration:
// OKLCH token definitions, native oklch() serialization, and perceptual
// (Oklab) color-mix interpolation in the stylesheets.
//
// The OKLCH components were computed from the original sRGB palette and
// verified to round-trip byte-exact (oklch -> sRGB reproduces the origin
// hex). Origin hexes are preserved per token in $extensions.
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compileTokens } from "../../../scripts/build-tokens.js";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("W3C CSS Color Module Level 5 & OKLCH Implementation", () => {
  it("defines color tokens in OKLCH space within design-tokens.tokens.json", () => {
    const json = JSON.parse(read("tokens/design-tokens.tokens.json"));

    expect(json.primitive.color.blue["500"].$value.colorSpace).toBe("oklch");
    expect(json.primitive.color.blue["500"].$value.components).toEqual([
      0.5635, 0.2408, 260.82,
    ]);
    // Neutral grays are canonicalized to zero chroma.
    expect(json.primitive.color.gray["50"].$value.components).toEqual([
      0.9851, 0, 0,
    ]);
  });

  it("preserves the sRGB origin of every OKLCH primitive for auditability", () => {
    const json = JSON.parse(read("tokens/design-tokens.tokens.json"));
    const grays = json.primitive.color.gray;

    expect(grays["50"].$extensions["com.natspaper.srgb"]).toBe("#fafafa");
    expect(grays["950"].$extensions["com.natspaper.srgb"]).toBe("#121212");
    expect(json.primitive.color.blue["500"].$extensions["com.natspaper.srgb"]).toBe(
      "#0066ff"
    );
  });

  it("compiles OKLCH format to CSS Custom Properties", () => {
    const compiledCss = compileTokens(read("tokens/design-tokens.tokens.json"));

    // Light theme
    expect(compiledCss).toContain("--accent: oklch(0.5635 0.2408 260.82);");
    expect(compiledCss).toContain("--background: oklch(0.9851 0 0);");

    // Dark theme
    expect(compiledCss).toContain('html[data-theme="dark"] {');
    expect(compiledCss).toContain("--accent: oklch(0.7379 0.1379 254.36);");
    expect(compiledCss).toContain("--background: oklch(0.1822 0 0);");
  });

  it("emits every semantic color natively in oklch() (no bare hex fallbacks)", () => {
    const compiledCss = compileTokens(read("tokens/design-tokens.tokens.json"));

    const declarations = compiledCss
      .split("\n")
      .filter((line) => line.trim().startsWith("--"));
    expect(declarations.length).toBeGreaterThanOrEqual(14);
    for (const declaration of declarations) {
      expect(declaration).toMatch(/:\s*oklch\(/);
    }
  });

  it("uses perceptual Oklab interpolation for color-mix in stylesheets", () => {
    for (const file of [
      "src/styles/typography.css",
      "src/components/post/Bibliography.astro",
      "src/components/features/Hero.astro",
    ]) {
      // Match on the space keyword alone: prettier may wrap long calls so
      // "in oklab," lands on its own line.
      expect(read(file)).toContain("in oklab");
    }
    // The legacy gamma-space interpolation must be fully retired. Match on
    // "in srgb" (not the full call) so multi-line color-mix() calls — where
    // the interpolation space sits on its own line — cannot slip through.
    for (const file of [
      "src/styles/typography.css",
      "src/components/post/Bibliography.astro",
      "src/components/features/Hero.astro",
      "src/components/post/PostSummaryCard.astro",
      "src/components/post/FeaturedPostCard.astro",
    ]) {
      expect(read(file)).not.toContain("in srgb");
    }
  });
});
