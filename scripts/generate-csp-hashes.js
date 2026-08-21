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
function extractInlineContents(html) {
  const scripts = [];
  const styles = [];

  // Match <script>...</script> WITHOUT a src attribute (inline only).
  // NOTE: `\ssrc=` (whitespace + attribute name + equals) is deliberate.
  // A word-boundary pattern like \bsrc\b also matches data-src, which
  // would wrongly exclude inline scripts carrying that attribute.
  const scriptRegex = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    // Hash the RAW bytes between the tags — browsers hash the exact
    // document bytes, so trimming here would silently break the CSP.
    // Empty content is skipped only because hashing "" is meaningless,
    // not because whitespace is insignificant.
    const content = match[1];
    if (content.trim().length > 0) scripts.push(content);
  }

  // Match all <style>...</style> blocks. <style> elements cannot have an
  // href attribute, so no exclusion lookahead is needed (a data-href-style
  // attribute would otherwise be misdetected, same class of bug as src).
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  while ((match = styleRegex.exec(html)) !== null) {
    const content = match[1];
    if (content.trim().length > 0) styles.push(content);
  }

  return { scripts, styles };
}

// ── 3. Compute SHA-256 hash in CSP format ───────────────────────────
function cspHash(content) {
  const hash = crypto.createHash("sha256").update(content, "utf8").digest("base64");
  return `'sha256-${hash}'`;
}

// ── 4. Main ─────────────────────────────────────────────────────────
const htmlFiles = findHtmlFiles(distDir);
if (htmlFiles.length === 0) {
  console.error("❌ No HTML files found in dist/. Please run 'astro build' first.");
  process.exit(1);
}

const scriptHashes = new Set();
const styleHashes = new Set();

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const { scripts, styles } = extractInlineContents(html);
  scripts.forEach(s => scriptHashes.add(cspHash(s)));
  styles.forEach(s => styleHashes.add(cspHash(s)));
}

console.log(`🔐 CSP Hash Generation`);
console.log(`   HTML files scanned: ${htmlFiles.length}`);
console.log(`   Unique script hashes: ${scriptHashes.size}`);
console.log(`   Unique style hashes: ${styleHashes.size}`);

// ── 5. Build new CSP (Hardened: removed unsafe-inline, data: and wasm-unsafe-eval)
const scriptSrc = [
  ...scriptHashes,
  "'self'",
  "https://giscus.app",
  "https://va.vercel-scripts.com",
].join(" ");

const styleSrc = [
  ...styleHashes,
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
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

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