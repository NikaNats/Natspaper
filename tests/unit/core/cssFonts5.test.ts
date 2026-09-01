// tests/unit/core/cssFonts5.test.ts
// Regression tests for the W3C CSS Fonts Module Level 5 integration
// (text-scale opt-in, metric-matched zero-CLS fallback faces, relative root
// sizing, and x-height aspect normalization). Metric values are pinned to the
// output of scripts/compute-font-fallbacks.py — if you regenerate them,
// update both base.css and these assertions together.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("W3C CSS Fonts Module Level 5 Integration", () => {
  it("declares <meta name='text-scale' content='scale'> in Layout.astro", () => {
    const layout = read("src/layouts/Layout.astro");
    expect(layout).toMatch(
      /<meta\s+name=["']text-scale["']\s+content=["']scale["']/i
    );
  });

  it("defines font family tokens and utility mappings in global.css @theme", () => {
    const globalCss = read("src/styles/global.css");
    expect(globalCss).toContain('--font-inter: "Inter", "Inter-Fallback";');
    expect(globalCss).toContain(
      '--font-georgian: "Noto Sans Georgian", "Georgian-Fallback";'
    );
    expect(globalCss).toContain(
      '--font-jetbrains-mono: "JetBrains Mono", "Mono-Fallback";'
    );
    // font-sans / font-mono utilities must route through the tokens,
    // otherwise <body> keeps Tailwind's default system stack.
    expect(globalCss).toContain("--font-sans: var(--font-inter)");
    expect(globalCss).toContain("--font-mono: var(--font-jetbrains-mono)");
  });

  it("declares metric-matched @font-face fallback rules in base.css", () => {
    const baseCss = read("src/styles/base.css");
    for (const family of [
      "Inter-Fallback",
      "Georgian-Fallback",
      "Mono-Fallback",
    ]) {
      expect(baseCss).toContain(`font-family: "${family}";`);
    }
    // Pinned measured values (Arial / Segoe UI / Consolas calibration).
    expect(baseCss).toContain("size-adjust: 104.71%;");
    expect(baseCss).toContain("size-adjust: 101.1%;");
    expect(baseCss).toContain("size-adjust: 109.13%;");
    for (const descriptor of [
      "size-adjust:",
      "ascent-override:",
      "descent-override:",
      "line-gap-override:",
      "unicode-range:",
    ]) {
      expect(baseCss).toContain(descriptor);
    }
    // Generic family keywords are invalid inside local() and would make the
    // whole src list unusable.
    expect(baseCss).not.toContain('local("sans-serif")');
    expect(baseCss).not.toContain('local("monospace")');
    // The Georgian fallback face must only claim Georgian codepoints.
    expect(baseCss).toMatch(/Georgian-Fallback[\s\S]*?U\+10A0-10FF/);
  });

  it("uses relative percentage font-size on html in base.css", () => {
    const baseCss = read("src/styles/base.css");
    expect(baseCss).toContain("font-size: 100%;");
    expect(baseCss).toContain("font-size: 112.5%;");
    expect(baseCss).not.toMatch(/html\s*\{[^}]*font-size:\s*16px;/);
    expect(baseCss).not.toMatch(/font-size:\s*18px;/);
  });

  it("applies font-size-adjust and citation baseline fixes in typography.css", () => {
    const typographyCss = read("src/styles/typography.css");
    // Inter's measured ex-height ratio (sxHeight 1118 / upem 2048).
    expect(typographyCss).toContain("font-size-adjust: 0.5459;");
    // Headings normalize by cap-height via the two-value form (a bare number
    // would be interpreted as an ex-height ratio and inflate headings).
    expect(typographyCss).toContain("font-size-adjust: cap-height from-font;");
    // MathML/KaTeX must be insulated from prose aspect scaling.
    expect(typographyCss).toMatch(/math\s*\{[\s\S]*?font-size-adjust:\s*none/);
    // Academic citation superscripts keep the line grid intact.
    expect(typographyCss).toContain('a[role="doc-biblioref"]');
    expect(typographyCss).toContain("line-height: 0;");
  });
});
