#!/usr/bin/env node

/**
 * Build Verification Script
 * Checks that all critical files and folders are created after build
 * Prevents deployment of incomplete builds
 *
 * Run: npm run verify-build
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Critical files and directories that must exist after build
const REQUIRED_ARTIFACTS = [
  "dist/index.html", // Main page exists
  "dist/robots.txt", // SEO: robots.txt
  "dist/sitemap-index.xml", // SEO: sitemap
  "dist/rss.xml", // RSS feed
  "dist/404.html", // Error page
  "public/pagefind", // Search index
  "public/pagefind/pagefind.js", // Search engine
];

// Optional but important files
const IMPORTANT_ARTIFACTS = [
  "dist/rss.xml",
  "public/pagefind/pagefind-modular-ui.js",
];

console.log("🔍 Verifying build artifacts...\n");

let errors = [];
let warnings = [];

// Check required artifacts
for (const artifact of REQUIRED_ARTIFACTS) {
  const fullPath = path.join(projectRoot, artifact);

  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    const size = (stats.size / 1024).toFixed(2);
    console.log(`✅ ${artifact} (${size} KB)`);
  } else {
    errors.push(`❌ MISSING: ${artifact}`);
    console.log(`❌ ${artifact} - NOT FOUND`);
  }
}

console.log("\n📋 Checking important files...");

// Check important artifacts
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
console.log("\n📦 Build Size Analysis:");
try {
  const distSize = getDirectorySize(path.join(projectRoot, "dist"));
  console.log(`   dist folder: ${(distSize / 1024 / 1024).toFixed(2)} MB`);

  if (distSize < 100 * 1024) {
    // Less than 100KB
    warnings.push("Build size seems very small - check if build completed");
  }
} catch {
  warnings.push("Could not calculate build size");
}

// Summary
console.log("\n" + "=".repeat(50));

if (errors.length === 0) {
  console.log("✅ BUILD VERIFICATION PASSED");
  console.log(`   All ${REQUIRED_ARTIFACTS.length} critical artifacts found!`);

  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${warnings.length}`);
    for (const w of warnings) {
      console.log(`   ${w}`);
    }
  }

  process.exit(0);
} else {
  console.log("❌ BUILD VERIFICATION FAILED");
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

  console.log("\n💡 Next Steps:");
  console.log("   1. Check build output for errors");
  console.log("   2. Run: npm run build");
  console.log("   3. Then: npm run verify-build");

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
