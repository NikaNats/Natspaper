#!/usr/bin/env node

/**
 * Build Verification Script (SRE Guardrails)
 * ==========================================
 * Prevents deployment of broken builds by validating:
 * 1. Critical HTML pages exist
 * 2. CSS/JS bundles exist and have non-zero size
 * 3. SEO assets (sitemap, robots.txt) are present
 * 4. Build size is reasonable (not empty or suspiciously small)
 *
 * AVAILABILITY RISK: Silent build failures can deploy blank pages,
 * causing 100% downtime for affected routes.
 *
 * Run: npm run verify-build
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Minimum file sizes to detect corrupt/empty files
const MIN_FILE_SIZES = {
  html: 500, // HTML pages should be at least 500 bytes
  css: 100, // CSS files should be at least 100 bytes
  js: 100, // JS files should be at least 100 bytes
};

// Files that are intentionally small (redirects, etc.)
const REDIRECT_FILES = new Set([
  "dist/index.html", // i18n redirect to /en/
]);

// Critical files and directories that must exist after build
const REQUIRED_ARTIFACTS = [
  "dist/index.html", // Redirect page (small is OK)
  "dist/en/index.html", // Main English page
  "dist/ka/index.html", // Main Georgian page
  "dist/robots.txt", // SEO: robots.txt
  "dist/sitemap-index.xml", // SEO: sitemap
  "dist/en/rss.xml", // RSS feed (generated under locale path)
  "dist/en/404/index.html", // English error page
  "dist/ka/404/index.html", // Georgian error page
  "dist/api/health.json", // Health check endpoint for uptime monitoring
];

// Asset directories that must contain files
const REQUIRED_ASSET_DIRS = [
  { path: "dist/_astro", minFiles: 1, description: "Astro bundled assets" },
];

// Optional but important files
const IMPORTANT_ARTIFACTS = [
  "dist/en/rss.xml",
];

console.log("🔍 Verifying build artifacts...\n");
console.log("=".repeat(50));

let errors = [];
let warnings = [];

// Check required artifacts with size validation
console.log("\n📄 Critical Files:");
for (const artifact of REQUIRED_ARTIFACTS) {
  const fullPath = path.join(projectRoot, artifact);

  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    const size = stats.size;
    const sizeKB = (size / 1024).toFixed(2);

    // Determine file type for size validation
    const ext = path.extname(artifact).slice(1);
    const minSize = MIN_FILE_SIZES[ext] || 0;

    // Skip size validation for known redirect files
    const isRedirect = REDIRECT_FILES.has(artifact);

    if (!isRedirect && size < minSize) {
      errors.push(`❌ CORRUPT: ${artifact} (${size} bytes < ${minSize} min)`);
      console.log(`❌ ${artifact} - CORRUPT (only ${size} bytes)`);
    } else if (isRedirect) {
      console.log(`✅ ${artifact} (${sizeKB} KB) [redirect]`);
    } else {
      console.log(`✅ ${artifact} (${sizeKB} KB)`);
    }
  } else {
    errors.push(`❌ MISSING: ${artifact}`);
    console.log(`❌ ${artifact} - NOT FOUND`);
  }
}

// Check asset directories
console.log("\n📦 Asset Bundles:");
for (const dir of REQUIRED_ASSET_DIRS) {
  const fullPath = path.join(projectRoot, dir.path);

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    const files = fs.readdirSync(fullPath);
    const cssFiles = files.filter(f => f.endsWith(".css"));
    const jsFiles = files.filter(f => f.endsWith(".js"));

    if (files.length < dir.minFiles) {
      errors.push(
        `❌ EMPTY: ${dir.path} (${files.length} files < ${dir.minFiles} min)`
      );
      console.log(`❌ ${dir.path} - TOO FEW FILES (${files.length})`);
    } else {
      console.log(`✅ ${dir.path} (${files.length} files)`);
      console.log(`   ├─ CSS: ${cssFiles.length} files`);
      console.log(`   └─ JS:  ${jsFiles.length} files`);

      // Validate CSS bundle sizes
      for (const cssFile of cssFiles) {
        const cssPath = path.join(fullPath, cssFile);
        const cssSize = fs.statSync(cssPath).size;
        if (cssSize < MIN_FILE_SIZES.css) {
          warnings.push(`⚠️ Small CSS: ${cssFile} (${cssSize} bytes)`);
        }
      }

      // Validate JS bundle sizes
      for (const jsFile of jsFiles) {
        const jsPath = path.join(fullPath, jsFile);
        const jsSize = fs.statSync(jsPath).size;
        if (jsSize < MIN_FILE_SIZES.js) {
          warnings.push(`⚠️ Small JS: ${jsFile} (${jsSize} bytes)`);
        }
      }
    }
  } else {
    errors.push(`❌ MISSING DIR: ${dir.path} (${dir.description})`);
    console.log(`❌ ${dir.path} - NOT FOUND`);
  }
}

// Check important artifacts
console.log("\n📋 Optional Files:");
for (const artifact of IMPORTANT_ARTIFACTS) {
  const fullPath = path.join(projectRoot, artifact);

  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    const size = (stats.size / 1024).toFixed(2);
    console.log(`✅ ${artifact} (${size} KB)`);
  } else {
    warnings.push(`⚠️  OPTIONAL: ${artifact}`);
    console.log(`⚠️  ${artifact} - not found`);
  }
}

// Check dist folder size
console.log("\n📊 Build Size Analysis:");
try {
  const distSize = getDirectorySize(path.join(projectRoot, "dist"));
  const distSizeMB = (distSize / 1024 / 1024).toFixed(2);
  console.log(`   Total dist size: ${distSizeMB} MB`);

  // Count HTML pages
  const htmlCount = countFilesByExtension(
    path.join(projectRoot, "dist"),
    ".html"
  );
  console.log(`   HTML pages: ${htmlCount}`);

  if (distSize < 100 * 1024) {
    // Less than 100KB
    errors.push(
      `❌ Build size critically small (${distSizeMB} MB) - build may have failed`
    );
  } else if (distSize < 500 * 1024) {
    // Less than 500KB
    warnings.push(`⚠️ Build size seems small (${distSizeMB} MB)`);
  }

  if (htmlCount < 5) {
    errors.push(
      `❌ Too few HTML pages (${htmlCount}) - content may be missing`
    );
  }
} catch (e) {
  warnings.push(`⚠️ Could not calculate build size: ${e.message}`);
}

// Summary
console.log("\n" + "=".repeat(50));

if (errors.length === 0) {
  console.log("✅ BUILD VERIFICATION PASSED");
  console.log(`   All ${REQUIRED_ARTIFACTS.length} critical artifacts found!`);
  console.log(`   Asset bundles validated!`);

  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${warnings.length}`);
    for (const w of warnings) {
      console.log(`   ${w}`);
    }
  }

  console.log("\n🚀 Build is ready for deployment!");
  process.exit(0);
} else {
  console.log("❌ BUILD VERIFICATION FAILED");
  console.log("\n🚨 DEPLOYMENT BLOCKED - Fix these issues first:");
  console.log(`\n❌ Critical Issues: ${errors.length}`);
  for (const e of errors) {
    console.log(`   ${e}`);
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${warnings.length}`);
    for (const w of warnings) {
      console.log(`   ${w}`);
    }
  }

  console.log("\n💡 Troubleshooting Steps:");
  console.log("   1. Check build output for errors");
  console.log("   2. Run: pnpm run build");
  console.log("   3. Inspect dist/ folder contents");
  console.log("   4. Then: pnpm run verify-build");

  process.exit(1);
}

/**
 * Calculate total size of a directory recursively
 */
function getDirectorySize(dirPath) {
  let size = 0;

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  }

  return size;
}

/**
 * Count files with a specific extension recursively
 */
function countFilesByExtension(dirPath, extension) {
  let count = 0;

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      count += countFilesByExtension(filePath, extension);
    } else if (file.endsWith(extension)) {
      count++;
    }
  }

  return count;
}
