// tests/unit/core/apcaContrast.test.ts
// Regression suite for the APCA 0.0.98G-4g engine and the design-token
// contrast contract. Keystone values verified against the 0.0.98G algorithm
// (including the soft-black clamp, which is what makes black-on-#aaa ≈ 58).
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calcAPCA, parseHex } from "../../../src/utils/core/apca";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const TOKENS_PATH = path.join(ROOT, "tokens", "design-tokens.tokens.json");

const tokensJson: Record<string, unknown> = JSON.parse(
  fs.readFileSync(TOKENS_PATH, "utf8")
);

function tokenHex(token: Record<string, unknown>): string {
  // Semantic tokens reference primitives via {alias} chains; the sRGB origin
  // hex lives in $extensions on the primitive the alias resolves to.
  let node = token as {
    $value?: unknown;
    $extensions?: Record<string, string>;
  };
  let depth = 0;
  while (
    node &&
    typeof node.$value === "string" &&
    (node.$value as string).startsWith("{")
  ) {
    let cur = tokensJson;
    for (const part of (node.$value as string).slice(1, -1).split(".")) {
      cur = cur[part] as Record<string, unknown>;
    }
    node = cur as typeof node;
    if (++depth > 16) throw new Error("Token alias depth exceeded (cycle?)");
  }
  const hex = node?.$extensions?.["com.natspaper.srgb"];
  if (!hex) throw new Error("Token missing $extensions sRGB origin hex");
  return hex;
}

describe("W3C WCAG 3.0 / APCA 0.0.98G-4g Visual Contrast Conformance", () => {
  it("satisfies the APCA keystone reference checks (0.0.98G constants)", () => {
    const white = { r: 255, g: 255, b: 255 };
    const gray888 = { r: 136, g: 136, b: 136 };
    const black = { r: 0, g: 0, b: 0 };
    const grayAaa = { r: 170, g: 170, b: 170 };

    expect(calcAPCA(gray888, white)).toBeCloseTo(63.05, 1); // Normal polarity
    expect(calcAPCA(white, gray888)).toBeCloseTo(-68.54, 1); // Reverse polarity
    expect(calcAPCA(black, grayAaa)).toBeCloseTo(58.14, 1); // soft black clamp
    expect(calcAPCA(grayAaa, black)).toBeCloseTo(-56.24, 1);
  });

  it("evaluates Light Mode body text to preferred Lc >= 90", () => {
    const json = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));
    const text = parseHex(tokenHex(json.semantic.light.text.primary)); // #212121
    const bg = parseHex(tokenHex(json.semantic.light.surface.background)); // #fafafa

    const lc = calcAPCA(text, bg);
    expect(lc).toBeGreaterThanOrEqual(90.0); // Exceeds preferred threshold
  });

  it("evaluates Dark Mode body text to comfortable Lc between -98 and -75", () => {
    const json = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));
    const text = parseHex(tokenHex(json.semantic.dark.text.primary)); // #e0e0e0
    const bg = parseHex(tokenHex(json.semantic.dark.surface.background)); // #121212

    const lc = calcAPCA(text, bg);
    expect(lc).toBeLessThanOrEqual(-75.0); // Negative indicates dark mode
    expect(lc).toBeGreaterThanOrEqual(-98.0); // Prevents over-brightness halation
  });

  it("evaluates secondary text to |Lc| >= 60 in both themes", () => {
    const json = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));
    const lightLc = Math.abs(
      calcAPCA(
        parseHex(tokenHex(json.semantic.light.text.secondary)),
        parseHex(tokenHex(json.semantic.light.surface.background))
      )
    );
    const darkLc = Math.abs(
      calcAPCA(
        parseHex(tokenHex(json.semantic.dark.text.secondary)),
        parseHex(tokenHex(json.semantic.dark.surface.background))
      )
    );

    expect(lightLc).toBeGreaterThanOrEqual(60.0);
    expect(darkLc).toBeGreaterThanOrEqual(60.0);
  });

  it("evaluates accent tokens to the large/emphasis-text threshold |Lc| >= 45", () => {
    // Accent plays mixed roles (icons, badges, borders, links); 45 is the
    // large-text floor. Measured: light ≈ +69.4, dark ≈ -55.9. Reaching the
    // 60 content-text bar for dark-mode links would require lightening the
    // dark accent — a deliberate design decision, tracked in the audit.
    const json = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));
    const lightLc = Math.abs(
      calcAPCA(
        parseHex(tokenHex(json.semantic.light.accent.default)),
        parseHex(tokenHex(json.semantic.light.surface.background))
      )
    );
    const darkLc = Math.abs(
      calcAPCA(
        parseHex(tokenHex(json.semantic.dark.accent.default)),
        parseHex(tokenHex(json.semantic.dark.surface.background))
      )
    );

    expect(lightLc).toBeGreaterThanOrEqual(45.0);
    expect(darkLc).toBeGreaterThanOrEqual(45.0);
  });
});
