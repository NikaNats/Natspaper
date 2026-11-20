#!/usr/bin/env node
/**
 * CSP Hash Generator for Astro SSG
 * =================================
 * Scans all built HTML files, extracts inline <script> and <style> contents,
 * computes SHA-256 hashes, and updates vercel.json CSP headers.
 *
 * Run: node scripts/generate-csp-hashes.js
 * Integrated into: pnpm build:prod (after astro build, before verify-build)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const vercelJsonPath = path.join(projectRoot, "vercel.json");

// ── 1. Recursively find all HTML files ──────────────────────────────
function findHtmlFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(fullPath));
    } else if (entry.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }
  return results;
}

// ── 2. Extract inline script/style contents ─────────────────────────

/**
 * JavaScript MIME type essences (WHATWG MIME Sniffing §4.6). A <script> whose
 * type is one of these (or absent/empty) is a classic script.
 */
const JS_MIME_TYPES = new Set([
  "application/ecmascript",
  "application/javascript",
  "application/x-ecmascript",
  "application/x-javascript",
  "text/ecmascript",
  "text/javascript",
  "text/javascript1.0",
  "text/javascript1.1",
  "text/javascript1.2",
  "text/javascript1.3",
  "text/javascript1.4",
  "text/javascript1.5",
  "text/jscript",
  "text/livescript",
  "text/x-ecmascript",
  "text/x-javascript",
]);

/** Non-classic script types that CSP script-src still governs. */
const CSP_GOVERNED_TYPES = new Set(["module", "importmap", "speculationrules"]);

/**
 * Whether CSP `script-src` applies to an inline <script> with this opening
 * tag (WHATWG HTML "prepare the script element").
 *
 * Any other type — notably `application/ld+json` structured data — is a
 * *data block*: the browser never executes it and CSP never checks it.
 * Hashing data blocks is not just useless, it is dangerous here: every post
 * has unique JSON-LD, so each new post would add a hash to the single global
 * CSP header until it outgrows edge/browser header limits (8–16 KB).
 */
export function isCspGovernedScript(openingTag) {
  const typeMatch = /\stype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(
    openingTag
  );
  if (!typeMatch) return true; // no type attribute → classic script
  const raw = (typeMatch[1] ?? typeMatch[2] ?? typeMatch[3] ?? "").trim();
  if (raw === "") return true;
  const essence = raw.toLowerCase().split(";")[0].trim();
  return JS_MIME_TYPES.has(essence) || CSP_GOVERNED_TYPES.has(essence);
}

export function extractInlineContents(html) {
  // Strip HTML comments FIRST. Comments may legitimately contain the literal
  // text "<script>" (e.g. JSDoc-style notes rendered into output); a naive
  // regex otherwise matches inside the comment and hashes everything from
  // there to the next </script> instead of the real script bytes — producing
  // CSP hashes that never match what the browser executes.
  const clean = html.replace(/<!--[\s\S]*?-->/g, "");

  const scripts = [];
  const styles = [];

  // Match <script>...</script> WITHOUT a src attribute (inline only).
  // NOTE: `\ssrc=` (whitespace + attribute name + equals) is deliberate.
  // A word-boundary pattern like \bsrc\b also matches data-src, which
  // would wrongly exclude inline scripts carrying that attribute.
  const scriptRegex = /(<script(?![^>]*\ssrc=)[^>]*>)([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(clean)) !== null) {
    if (!isCspGovernedScript(match[1])) continue;
    // Hash the RAW bytes between the tags — browsers hash the exact
    // document bytes, so trimming here would silently break the CSP.
    // Empty content is skipped only because hashing "" is meaningless,
    // not because whitespace is insignificant.
    const content = match[2];
    if (content.trim().length > 0) scripts.push(content);
  }

  // Match all <style>...</style> blocks. <style> elements cannot have an
  // href attribute, so no exclusion lookahead is needed (a data-href-style
  // attribute would otherwise be misdetected, same class of bug as src).
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  while ((match = styleRegex.exec(clean)) !== null) {
    const content = match[1];
    if (content.trim().length > 0) styles.push(content);
  }

  return { scripts, styles };
}

// ── 3. Compute SHA-256 hash in CSP format ───────────────────────────
export function cspHash(content) {
  const hash = crypto.createHash("sha256").update(content, "utf8").digest("base64");
  return `'sha256-${hash}'`;
}

// ── 4. Main ─────────────────────────────────────────────────────────
// Guarded so tests can import the pure helpers above without side effects.
const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) main();

function main() {
const htmlFiles = findHtmlFiles(distDir);
if (htmlFiles.length === 0) {
  console.error("❌ No HTML files found in dist/. Please run 'astro build' first.");
  process.exit(1);
}

const scriptHashes = new Set();
const styleHashes = new Set();

// Inline *module* scripts make Astro's ClientRouter inject a
// `data:application/javascript,` sentinel, which this CSP (no `data:` in
// script-src) blocks. Fail the build rather than ship broken navigation.
const inlineModuleRegex = /<script(?![^>]*\ssrc=)[^>]*\stype=["']?module["']?[^>]*>/i;
const inlineModuleOffenders = [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  if (inlineModuleRegex.test(html.replace(/<!--[\s\S]*?-->/g, ""))) {
    inlineModuleOffenders.push(path.relative(projectRoot, file));
  }
  const { scripts, styles } = extractInlineContents(html);
  scripts.forEach(s => scriptHashes.add(cspHash(s)));
  styles.forEach(s => styleHashes.add(cspHash(s)));
}

if (inlineModuleOffenders.length > 0) {
  console.error(
    `❌ ${inlineModuleOffenders.length} HTML file(s) contain inline <script type="module">, ` +
      `which requires 'data:' in script-src for Astro's ClientRouter.\n` +
      `   Keep processed scripts external (config/vite.ts assetsInlineLimit) or use is:inline.\n` +
      inlineModuleOffenders.slice(0, 10).map(f => `   - ${f}`).join("\n")
  );
  process.exit(1);
}

console.log(`🔐 CSP Hash Generation`);
console.log(`   HTML files scanned: ${htmlFiles.length}`);
console.log(`   Unique script hashes: ${scriptHashes.size}`);
console.log(`   Unique style hashes: ${styleHashes.size}`);

// ── 5. Build new CSP ────────────────────────────────────────────────
// script-src: hash-gated inline scripts + same-origin files. No `data:`:
// it would let any injected `<script src="data:...">` run and defeat the
// hashes. Astro's ClientRouter only needs `data:` for its inline-module
// sentinel, which is never emitted because config/vite.ts keeps processed
// scripts external (assetsInlineLimit) — enforced below.
const scriptSrc = [
  ...scriptHashes,
  "'self'",
  "https://giscus.app",
  "https://va.vercel-scripts.com",
].join(" ");

// style-src: 'unsafe-inline' ONLY, with NO hash sources.
// W3C CSP3: the presence of any hash/nonce source in a directive makes
// browsers IGNORE 'unsafe-inline'. Astro's View Transitions router injects
// <style> elements at runtime during DOM swaps (router.js /
// swap-functions.js); their content cannot be precomputed, so keeping
// hashes here would re-disable 'unsafe-inline' and block every transition.
const styleSrc = [
  "'unsafe-inline'",
  "'self'",
  "https://fonts.googleapis.com",
  "https://giscus.app",
].join(" ");

const newCsp = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  `style-src ${styleSrc}`,
  "img-src 'self' data: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://giscus.app https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "frame-src https://giscus.app",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

// Budget guard: response headers share an ~8 KB limit at many CDNs/proxies
// (and 16 KB in browsers). The policy is per-site, not per-page, so it must
// stay roughly constant as content grows; fail loudly if it ever creeps up.
const CSP_BUDGET_BYTES = 4096;
const cspBytes = Buffer.byteLength(newCsp, "utf8");
if (cspBytes > CSP_BUDGET_BYTES) {
  console.error(
    `❌ Content-Security-Policy is ${cspBytes} bytes (budget ${CSP_BUDGET_BYTES}). ` +
      `An inline script is probably varying per page; move it to a bundled ` +
      `<script> or make its content static.`
  );
  process.exit(1);
}

// ── 6. Update vercel.json ───────────────────────────────────────────
const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, "utf8"));

for (const headerBlock of vercelConfig.headers) {
  if (headerBlock.source === "/(.*)") {
    const cspHeader = headerBlock.headers.find(
      h => h.key === "Content-Security-Policy"
    );
    if (cspHeader) {
      cspHeader.value = newCsp;
    }
  }
}

fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelConfig, null, 2) + "\n");
console.log(`✅ vercel.json updated with ${scriptHashes.size} script + ${styleHashes.size} style hashes`);
}
