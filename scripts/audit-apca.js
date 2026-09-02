#!/usr/bin/env node
/**
 * Automated APCA 0.0.98G-4g / WCAG 3.0 Contrast Auditor for Natspaper
 *
 * Reads tokens/design-tokens.tokens.json, resolves semantic aliases down to
 * their origin sRGB hexes (preserved per token in $extensions), and audits
 * the light/dark token pairs against the APCA Readability Criterion:
 *   - Body text:            |Lc| >= 75 minimum, 90 preferred
 *   - Secondary text:       |Lc| >= 60
 *   - Accent (mixed role):  |Lc| >= 45 (large/emphasis text & non-text);
 *     values below 60 are reported as a warning for link-heavy usage.
 *
 * Requires Node >= 23.6 (native TypeScript type stripping for the .ts import).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const tokenPath = path.join(rootDir, "tokens", "design-tokens.tokens.json");

const { calcAPCA, parseHex } = await import("../src/utils/core/apca.ts");

const rawJson = JSON.parse(fs.readFileSync(tokenPath, "utf8"));

/** Follow DTCG {alias} chains down to the concrete token node. */
function resolveToken(token) {
  let node = token;
  let depth = 0;
  while (
    node &&
    typeof node === "object" &&
    typeof node.$value === "string" &&
    node.$value.startsWith("{")
  ) {
    let cur = rawJson;
    for (const part of node.$value.slice(1, -1).split(".")) {
      if (cur && typeof cur === "object" && part in cur) {
        cur = cur[part];
      } else {
        throw new Error(`Unresolvable token alias: ${node.$value}`);
      }
    }
    node = cur;
    if (++depth > 16) throw new Error("Token alias depth exceeded (cycle?)");
  }
  return node;
}

/** Resolve a token to its origin sRGB hex from $extensions. */
function getHex(tokenRef) {
  const node = resolveToken(tokenRef);
  if (node && typeof node === "object") {
    if (node.$extensions?.["com.natspaper.srgb"]) {
      return node.$extensions["com.natspaper.srgb"];
    }
    if (node.$value && typeof node.$value === "object" && node.$value.hex) {
      return node.$value.hex;
    }
  }
  throw new Error(
    `No sRGB origin hex found for token (expected $extensions["com.natspaper.srgb"])`
  );
}

const semantic = rawJson.semantic;
const lightBg = parseHex(getHex(semantic.light.surface.background));
const darkBg = parseHex(getHex(semantic.dark.surface.background));

console.log("\n=======================================================");
console.log("  APCA 0.0.98G-4g / WCAG 3.0 Visual Contrast Audit");
console.log("=======================================================\n");

const checks = [
  {
    name: "Light Mode - Primary Body Text",
    text: parseHex(getHex(semantic.light.text.primary)),
    bg: lightBg,
    min: 75,
    target: 90,
  },
  {
    name: "Light Mode - Secondary Text",
    text: parseHex(getHex(semantic.light.text.secondary)),
    bg: lightBg,
    min: 60,
    target: 75,
  },
  {
    name: "Light Mode - Accent (mixed role)",
    text: parseHex(getHex(semantic.light.accent.default)),
    bg: lightBg,
    min: 45,
    target: 60,
  },
  {
    name: "Dark Mode - Primary Body Text",
    text: parseHex(getHex(semantic.dark.text.primary)),
    bg: darkBg,
    min: 75,
    target: 90,
  },
  {
    name: "Dark Mode - Secondary Text",
    text: parseHex(getHex(semantic.dark.text.secondary)),
    bg: darkBg,
    min: 60,
    target: 75,
  },
  {
    name: "Dark Mode - Accent (mixed role)",
    text: parseHex(getHex(semantic.dark.accent.default)),
    bg: darkBg,
    min: 45,
    target: 60,
  },
];

let failed = false;

for (const check of checks) {
  const lc = calcAPCA(check.text, check.bg);
  const absLc = Math.abs(lc);
  const polarity = lc > 0 ? "Normal (BoW)" : "Reverse (WoB)";
  const status = absLc >= check.min ? "PASS" : "FAIL";
  const warning =
    status === "PASS" && absLc < check.target ? "  (below preferred target)" : "";

  console.log(
    `${status} [${polarity}] ${check.name}: Lc ${lc.toFixed(1)} (Min: ${check.min}, Target: ${check.target})${warning}`
  );
  if (absLc < check.min) {
    failed = true;
  }
}

console.log("\n-------------------------------------------------------");
if (failed) {
  console.error("APCA Visual Contrast Audit FAILED. Adjust token values.");
  process.exit(1);
}
console.log("All design tokens conform to the configured APCA thresholds.");
console.log("-------------------------------------------------------\n");
