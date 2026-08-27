#!/usr/bin/env node

/**
 * Build Verification Script (SRE Guardrails) v2
 * ==============================================
 * Prevents deployment of broken builds by validating:
 * 1. Critical HTML pages exist with structural integrity
 * 2. CSS/JS bundles exist and have non-zero size
 * 3. SEO assets (sitemap, robots.txt) are present AND valid
 * 4. Static assets (favicon, fonts, OG images) are present
 * 5. Build size is reasonable (not empty or suspiciously small)
 *
 * CLI Flags:
 *   --json     Output results as JSON (for CI/CD parsing)
 *   --strict   Treat warnings as errors
 *   --verbose  Show detailed file-by-file output
 *
 * Run: node scripts/verify-build.js [--json] [--strict] [--verbose]
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

// ── CLI Argument Parsing ─────────────────────────────────────────────
const args = process.argv.slice(2);
const FLAGS = {
  json: args.includes("--json"),
  strict: args.includes("--strict"),
  verbose: args.includes("--verbose"),
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

// ── Configuration (extracted from magic numbers) ─────────────────────
const CONFIG = {
  minFileSizes: {
    html: 2_000,   // bytes — minimal Astro page with <head>
    css: 1_000,    // bytes — Tailwind bundle with utilities
    js: 200,       // bytes — non-empty module preamble
    xml: 100,      // bytes — minimal valid XML
    txt: 50,       // bytes — minimal robots.txt
    json: 20,      // bytes — minimal JSON object
  },
  buildSize: {
    criticalMinBytes: 100 * 1024,   // 100 KB — below = build failed
    warningMinBytes: 500 * 1024,    // 500 KB — below = suspicious
  },
  minHtmlPages: 5,                  // en + ka + 404s + posts
};

// ── Structural HTML Content Checks ───────────────────────────────────
const HTML_CONTENT_CHECKS = [
  {
    file: "dist/en/index.html",
    markers: ["<html", "</head>", "</body>", "<main", "charset"],
  },
  {
    file: "dist/ka/index.html",
    markers: ["<html", "</head>", "</body>", "<main", "charset"],
  },
  {
    file: "dist/en/404/index.html",
    markers: ["<html", "404", "</body>"],
  },
  {
    file: "dist/ka/404/index.html",
    markers: ["<html", "404", "</body>"],
  },
  {
    file: "dist/404.html",
    markers: ["<html", "404", "</body>"],
  },
];

// ── SEO Content Validation (RFC 9309 & Sitemaps) ──────────────────────
const SEO_CONTENT_CHECKS = [
  {
    file: "dist/robots.txt",
    markers: ["User-agent:", "Allow:", "Disallow:", "Sitemap:", "sitemap-index.xml"],
    description: "robots.txt must conform to RFC 9309 ABNF grammar and define sitemap index",
  },
  {
    file: "dist/sitemap-index.xml",
    markers: ["<?xml", "<sitemapindex", "</sitemapindex>"],
    description: "sitemap-index.xml must be valid XML with sitemapindex root",
  },
];

// ── Required Artifacts (deduplicated) ────────────────────────────────
const REDIRECT_FILES = new Set(["dist/index.html"]);

const REQUIRED_ARTIFACTS = [
  "dist/index.html",
  "dist/en/index.html",
  "dist/ka/index.html",
  "dist/robots.txt",
  "dist/sitemap-index.xml",
  "dist/en/rss.xml",
  "dist/ka/rss.xml",
  "dist/en/atom.xml",
  "dist/ka/atom.xml",
  "dist/en/404/index.html",
  "dist/ka/404/index.html",
  "dist/404.html",
  "dist/api/health.json",
  "dist/favicon.svg",
];

const REQUIRED_ASSET_DIRS = [
  { path: "dist/_astro", minFiles: 1, description: "Astro bundled assets" },
];

// ── State ────────────────────────────────────────────────────────────
const errors = [];
const warnings = [];
const passed = [];

function log(msg) {
  if (!FLAGS.json) console.log(msg);
}

function addError(msg) {
  errors.push(msg);
  log(`❌ ${msg}`);
}

function addWarning(msg) {
  if (FLAGS.strict) {
    addError(`[strict] ${msg}`);
  } else {
    warnings.push(msg);
    log(`⚠️  ${msg}`);
  }
}

function addPass(msg) {
  passed.push(msg);
  if (FLAGS.verbose) log(`✅ ${msg}`);
}

// ── Helpers ──────────────────────────────────────────────────────────
function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return -1;
  }
}

function fileContains(filePath, marker) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.includes(marker);
  } catch {
    return false;
  }
}

function getDirectorySize(dirPath) {
  let size = 0;
  try {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        size += getDirectorySize(fullPath);
      } else {
        size += fs.statSync(fullPath).size;
      }
    }
  } catch { /* ignore permission errors */ }
  return size;
}

function countFilesByExtension(dirPath, extension) {
  let count = 0;
  try {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        count += countFilesByExtension(fullPath, extension);
      } else if (entry.name.endsWith(extension)) {
        count++;
      }
    }
  } catch { /* ignore */ }
  return count;
}

function findHtmlFiles(dir) {
  const results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findHtmlFiles(fullPath));
      } else if (entry.name.endsWith(".html")) {
        results.push(fullPath);
      }
    }
  } catch { /* ignore */ }
  return results;
}

// Mirrors scripts/generate-csp-hashes.js: raw bytes between tags,
// excluding only real src attributes (\ssrc= — not data-src etc.).
// HTML comments are stripped first (they may contain literal "<script>"
// text which would otherwise corrupt the extraction, same as the generator).
const INLINE_SCRIPT_REGEX = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;

function extractInlineScripts(html) {
  const clean = html.replace(/<!--[\s\S]*?-->/g, "");
  const scripts = [];
  let match;
  while ((match = INLINE_SCRIPT_REGEX.exec(clean)) !== null) {
    if (match[1].trim().length > 0) scripts.push(match[1]);
  }
  INLINE_SCRIPT_REGEX.lastIndex = 0;
  return scripts;
}

// ── 1. Required Artifacts ────────────────────────────────────────────
log("\n📄 Critical Files:");
for (const artifact of REQUIRED_ARTIFACTS) {
  const fullPath = path.join(projectRoot, artifact);
  const size = getFileSize(fullPath);

  if (size === -1) {
    addError(`MISSING: ${artifact}`);
    continue;
  }

  const ext = path.extname(artifact).slice(1);
  const minSize = CONFIG.minFileSizes[ext] || 0;
  const isRedirect = REDIRECT_FILES.has(artifact);
  const sizeKB = (size / 1024).toFixed(2);

  if (!isRedirect && size < minSize) {
    addError(`CORRUPT: ${artifact} (${size}B < ${minSize}B min)`);
  } else {
    addPass(`${artifact} (${sizeKB} KB)${isRedirect ? " [redirect]" : ""}`);
  }
}

// ── 2. Asset Directories ─────────────────────────────────────────────
log("\n📦 Asset Bundles:");
for (const dir of REQUIRED_ASSET_DIRS) {
  const fullPath = path.join(projectRoot, dir.path);

  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
    addError(`MISSING DIR: ${dir.path} (${dir.description})`);
    continue;
  }

  const files = fs.readdirSync(fullPath);
  const cssFiles = files.filter(f => f.endsWith(".css"));
  const jsFiles = files.filter(f => f.endsWith(".js"));

  if (files.length < dir.minFiles) {
    addError(`EMPTY: ${dir.path} (${files.length} files < ${dir.minFiles} min)`);
  } else {
    addPass(`${dir.path} (${files.length} files: ${cssFiles.length} CSS, ${jsFiles.length} JS)`);

    for (const cssFile of cssFiles) {
      const cssSize = getFileSize(path.join(fullPath, cssFile));
      if (cssSize < CONFIG.minFileSizes.css) {
        addWarning(`Small CSS: ${cssFile} (${cssSize}B)`);
      }
    }
    for (const jsFile of jsFiles) {
      const jsSize = getFileSize(path.join(fullPath, jsFile));
      if (jsSize < CONFIG.minFileSizes.js) {
        addWarning(`Small JS: ${jsFile} (${jsSize}B)`);
      }
    }
  }
}

// ── 3. HTML Content Integrity ────────────────────────────────────────
log("\n🔬 HTML Content Integrity:");
for (const { file, markers } of HTML_CONTENT_CHECKS) {
  const fullPath = path.join(projectRoot, file);

  if (!fs.existsSync(fullPath)) {
    log(`⏭️  ${file} - skipped (not found)`);
    continue;
  }

  const missing = markers.filter(m => !fileContains(fullPath, m));
  if (missing.length > 0) {
    addError(`CONTENT: ${file} missing: ${missing.map(m => `"${m}"`).join(", ")}`);
  } else {
    addPass(`${file} - all ${markers.length} markers present`);
  }
}

// ── 4. SEO Content Validation (NEW) ──────────────────────────────────
log("\n🔍 SEO Content Validation:");
for (const { file, markers, description } of SEO_CONTENT_CHECKS) {
  const fullPath = path.join(projectRoot, file);

  if (!fs.existsSync(fullPath)) {
    addError(`SEO: ${file} not found — ${description}`);
    continue;
  }

  const missing = markers.filter(m => !fileContains(fullPath, m));
  if (missing.length > 0) {
    addError(`SEO: ${file} invalid — missing: ${missing.map(m => `"${m}"`).join(", ")}`);
  } else {
    addPass(`${file} - valid (${description})`);
  }
}

// ── 5. CSP Hash Consistency (NEW) ────────────────────────────────────
// Closed-loop check: every inline script present in dist/ HTML must have
// its raw-byte SHA-256 hash listed in vercel.json's script-src directive.
// Catches stale vercel.json (e.g. a build that skipped generate-csp),
// which would ship pages whose inline scripts are blocked by the CSP.
log("\n🔐 CSP Hash Consistency:");
try {
  const vercelConfig = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "vercel.json"), "utf8")
  );
  const cspHeader = vercelConfig.headers
    .find(h => h.source === "/(.*)")
    ?.headers.find(h => h.key === "Content-Security-Policy");

  if (!cspHeader) {
    addError("CSP: Content-Security-Policy header not found in vercel.json");
  } else {
    const scriptSrcDirective =
      cspHeader.value
        .split(";")
        .map(d => d.trim())
        .find(d => d.startsWith("script-src")) ?? "";
    const allowedHashes = new Set(scriptSrcDirective.match(/'sha256-[^']+'/g) ?? []);

    if (allowedHashes.size === 0) {
      addError("CSP: script-src contains no sha256 hashes");
    } else {
      const htmlFiles = findHtmlFiles(distDir);
      let inlineScriptCount = 0;
      const missingHashes = new Set();

      for (const file of htmlFiles) {
        const html = fs.readFileSync(file, "utf8");
        for (const content of extractInlineScripts(html)) {
          inlineScriptCount++;
          const hash = crypto
            .createHash("sha256")
            .update(content, "utf8")
            .digest("base64");
          const cspHash = `'sha256-${hash}'`;
          if (!allowedHashes.has(cspHash)) {
            missingHashes.add(`${path.relative(projectRoot, file)} → ${cspHash}`);
          }
        }
      }

      if (missingHashes.size > 0) {
        addError(
          `CSP: ${missingHashes.size} inline script hash(es) missing from vercel.json (stale CSP — run "pnpm run generate-csp"):`
        );
        for (const entry of missingHashes) log(`   ❌ ${entry}`);
      } else {
        addPass(
          `CSP: all ${inlineScriptCount} inline scripts across ${htmlFiles.length} HTML files covered by ${allowedHashes.size} hashes in vercel.json`
        );
      }
    }
  }
} catch (err) {
  addError(`CSP: consistency check failed — ${err.message}`);
}

// ── RFC 9111 HTTP Caching Header Validation ──────────────────────────
log("\n⚡ RFC 9111 HTTP Caching Validation:");
try {
  const vercelConfig = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "vercel.json"), "utf8")
  );

  const astroHeaders = vercelConfig.headers.find(h => h.source === "/_astro/(.*)");
  const globalHeaders = vercelConfig.headers.find(h => h.source === "/(.*)");

  const astroCache = astroHeaders?.headers.find(h => h.key === "Cache-Control")?.value || "";
  const globalCache = globalHeaders?.headers.find(h => h.key === "Cache-Control")?.value || "";

  if (astroCache.includes("immutable") && astroCache.includes("max-age=31536000")) {
    addPass("RFC 9111: Immutable asset caching verified (/_astro/*)");
  } else {
    addError("RFC 9111: Missing immutable Cache-Control on /_astro/(.*)");
  }

  if (globalCache.includes("must-revalidate") && globalCache.includes("s-maxage=86400")) {
    addPass("RFC 9111: Revalidating Edge Cache verified for HTML pages (/(.*))");
  } else {
    addWarning("RFC 9111: HTML Cache-Control recommended: must-revalidate with s-maxage");
  }
} catch (err) {
  addError(`RFC 9111: Caching header check failed — ${err.message}`);
}

// ── RFC 6797 HSTS Security Header Validation ─────────────────────────
log("\n🔒 RFC 6797 HSTS Validation:");
try {
  const vercelConfig = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "vercel.json"), "utf8")
  );

  const globalHeaders = vercelConfig.headers.find(h => h.source === "/(.*)");
  const hstsHeader = globalHeaders?.headers.find(h => h.key === "Strict-Transport-Security")?.value || "";

  const maxAgeMatch = hstsHeader.match(/max-age=(\d+)/i);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
  const hasSubDomains = /includesubdomains/i.test(hstsHeader);
  const hasPreload = /preload/i.test(hstsHeader);

  // Criteria check (RFC 6797 & hstspreload.org)
  if (maxAge >= 31536000 && hasSubDomains && hasPreload) {
    addPass(`RFC 6797: Valid HSTS header (max-age=${maxAge}, includeSubDomains, preload)`);
  } else {
    if (maxAge < 31536000) {
      addError(`RFC 6797: HSTS max-age must be at least 31536000 seconds (got: ${maxAge})`);
    }
    if (!hasSubDomains) {
      addError("RFC 6797: Missing includeSubDomains directive");
    }
    if (!hasPreload) {
      addWarning("RFC 6797: Missing preload directive for hstspreload.org eligibility");
    }
  }
} catch (err) {
  addError(`RFC 6797: HSTS verification failed — ${err.message}`);
}

// ── RFC 8878 Zstandard Compression Validation ────────────────────────
log("\n🗜️ RFC 8878 Zstandard Validation:");
try {
  const htmlZst = path.join(distDir, "en/index.html.zst");
  const uncompressedHtml = path.join(distDir, "en/index.html");

  if (fs.existsSync(htmlZst)) {
    const rawSize = fs.statSync(uncompressedHtml).size;
    const zstdSize = fs.statSync(htmlZst).size;
    const ratio = ((1 - zstdSize / rawSize) * 100).toFixed(1);

    if (zstdSize < rawSize) {
      addPass(`RFC 8878: en/index.html.zst exists (${zstdSize}B, ${ratio}% compression ratio)`);
    } else {
      addWarning("RFC 8878: .zst file is larger than uncompressed source");
    }
  } else {
    addWarning("RFC 8878: No .zst pre-compressed assets found (optional for dev builds)");
  }
} catch (err) {
  addError(`RFC 8878: Zstd verification check failed — ${err.message}`);
}

// ── 6. Build Size Analysis ───────────────────────────────────────────
log("\n📊 Build Size Analysis:");
const distSize = getDirectorySize(distDir);
const distSizeMB = (distSize / 1024 / 1024).toFixed(2);
const htmlCount = countFilesByExtension(distDir, ".html");

log(`   Total dist size: ${distSizeMB} MB`);
log(`   HTML pages: ${htmlCount}`);

if (distSize < CONFIG.buildSize.criticalMinBytes) {
  addError(`Build size critically small (${distSizeMB} MB)`);
} else if (distSize < CONFIG.buildSize.warningMinBytes) {
  addWarning(`Build size seems small (${distSizeMB} MB)`);
}

if (htmlCount < CONFIG.minHtmlPages) {
  addError(`Too few HTML pages (${htmlCount} < ${CONFIG.minHtmlPages})`);
}

// ── 7. Summary ───────────────────────────────────────────────────────
const result = {
  passed: errors.length === 0,
  errors: errors.length,
  warnings: warnings.length,
  checks: passed.length,
  distSizeMB: parseFloat(distSizeMB),
  htmlPages: htmlCount,
  errorDetails: errors,
  warningDetails: warnings,
};

if (FLAGS.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  log("\n" + "=".repeat(50));
  if (errors.length === 0) {
    log("✅ BUILD VERIFICATION PASSED");
    log(`   ${passed.length} checks passed, ${warnings.length} warnings`);
    if (warnings.length > 0) {
      log("\n⚠️  Warnings:");
      warnings.forEach(w => log(`   ${w}`));
    }
    log("\n🚀 Build is ready for deployment!");
  } else {
    log("❌ BUILD VERIFICATION FAILED");
    log(`\n🚨 DEPLOYMENT BLOCKED — ${errors.length} critical issue(s):`);
    errors.forEach(e => log(`   ❌ ${e}`));
    if (warnings.length > 0) {
      log(`\n⚠️  Warnings: ${warnings.length}`);
      warnings.forEach(w => log(`   ${w}`));
    }
    log("\n💡 Troubleshooting:");
    log("   1. Check build output for errors");
    log("   2. Run: pnpm run build");
    log("   3. Inspect dist/ folder contents");
    log("   4. Then: pnpm run verify-build");
  }
}

process.exit(errors.length === 0 ? 0 : 1);