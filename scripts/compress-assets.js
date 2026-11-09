#!/usr/bin/env node

/**
 * RFC 8878 Zstandard (zstd) Asset Pre-Compressor
 * =============================================
 * Compresses static HTML, CSS, JS, SVG, JSON, and XML assets
 * into RFC 8878 compliant .zst files at build time.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import zlib from "node:zlib";

// Real RFC 8878 Zstandard via Node's built-in zlib binding (Node >= 22.15).
// Replaces the former "@mongodb-js/zstandard" shim, which wrote a zstd magic
// number in front of a *deflate* stream — not decodable as zstd by browsers.
const zstdCompress = promisify(zlib.zstdCompress);
const ZSTD_LEVEL = 19; // ultra-high ratio; fine for one-off static builds

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");

const COMPRESSIBLE_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".xml",
  ".svg",
  ".txt",
]);

// Minimum file size worth compressing (512 bytes)
const MIN_SIZE_BYTES = 512;

function getCompressibleFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getCompressibleFiles(fullPath));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (COMPRESSIBLE_EXTENSIONS.has(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

async function compressAll() {
  const files = getCompressibleFiles(distDir);
  if (files.length === 0) {
    console.log("⚠️ No compressible files found in dist/. Run 'astro build' first.");
    return;
  }

  console.log(`\n🗜️  RFC 8878 Zstandard Compression: processing ${files.length} assets...`);
  let totalSavedBytes = 0;
  let compressedCount = 0;

  for (const file of files) {
    const rawBuffer = fs.readFileSync(file);
    if (rawBuffer.length < MIN_SIZE_BYTES) continue;

    const compressedBuffer = await zstdCompress(rawBuffer, {
      params: {
        [zlib.constants.ZSTD_c_compressionLevel]: ZSTD_LEVEL,
        [zlib.constants.ZSTD_c_checksumFlag]: 1,
      },
    });

    if (compressedBuffer.length < rawBuffer.length) {
      const targetPath = `${file}.zst`;
      fs.writeFileSync(targetPath, compressedBuffer);
      totalSavedBytes += rawBuffer.length - compressedBuffer.length;
      compressedCount++;
    }
  }

  const savedKB = (totalSavedBytes / 1024).toFixed(2);
  console.log(`✅ RFC 8878: Created ${compressedCount} .zst assets (Saved ${savedKB} KB)\n`);
}

compressAll().catch(err => {
  console.error("❌ Zstd pre-compression failed:", err);
  process.exit(1);
});
