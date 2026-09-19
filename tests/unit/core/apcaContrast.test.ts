import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseHex, calcAPCA } from "../../../src/utils/core/apca";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const TOKENS_PATH = path.join(ROOT, "tokens", "design-tokens.tokens.json");

function tokenSrgb(json: any, ...trail: string[]): string {
  let node = json;
  for (const part of trail) node = node[part];
  return node.$extensions["com.natspaper.srgb"];
}

// Standard WCAG 2.1 relative luminance converter
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return (a[0]! * 0.2126) + (a[1]! * 0.7152) + (a[2]! * 0.0722);
}

function getWcagRatio(hex1: string, hex2: string): number {
  const c1 = parseHex(hex1);
  const c2 = parseHex(hex2);
  const l1 = getLuminance(c1.r, c1.g, c1.b);
  const l2 = getLuminance(c2.r, c2.g, c2.b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe("Design System Contrast Gates", () => {
  const lightBg = "#FAFAFA";
  const lightPrimaryText = "#212121";
  const lightSecondaryText = "#595959";
  const darkBg = "#141517";
  const darkPrimaryText = "#EBEBEB";
  const darkBorder = "#65686E";

  it("satisfies WCAG 2.2 AA Hard Gate (≥ 4.5:1) for body text", () => {
    expect(getWcagRatio(lightPrimaryText, lightBg)).toBeGreaterThanOrEqual(4.5);
    expect(getWcagRatio(darkPrimaryText, darkBg)).toBeGreaterThanOrEqual(4.5);
    expect(getWcagRatio(lightSecondaryText, lightBg)).toBeGreaterThanOrEqual(4.5);
  });

  it("satisfies WCAG 2.2 Non-Text Contrast (≥ 3.0:1) for structural borders in dark mode", () => {
    expect(getWcagRatio(darkBorder, darkBg)).toBeGreaterThanOrEqual(3.0);
  });

  it("stays linked to the token file (single source of truth)", () => {
    const json = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));
    expect(tokenSrgb(json, "semantic", "light", "surface", "background")).toBe(lightBg);
    expect(tokenSrgb(json, "semantic", "light", "text", "primary")).toBe(lightPrimaryText);
    expect(tokenSrgb(json, "semantic", "light", "text", "secondary")).toBe(lightSecondaryText);
    expect(tokenSrgb(json, "semantic", "dark", "surface", "background")).toBe(darkBg);
    expect(tokenSrgb(json, "semantic", "dark", "text", "primary")).toBe(darkPrimaryText);
    expect(tokenSrgb(json, "semantic", "dark", "surface", "border")).toBe(darkBorder);
  });

  it("satisfies APCA Readability Criterion for body text", () => {
    const lightLc = calcAPCA(parseHex(lightPrimaryText), parseHex(lightBg));
    const darkLc = calcAPCA(parseHex(darkPrimaryText), parseHex(darkBg));

    // Light mode normal polarity: Lc >= 75
    expect(lightLc).toBeGreaterThanOrEqual(75);
    // Dark mode reverse polarity: Lc between -75 and -95 (avoids halation)
    expect(darkLc).toBeLessThanOrEqual(-75);
    expect(darkLc).toBeGreaterThanOrEqual(-95);
  });
});
