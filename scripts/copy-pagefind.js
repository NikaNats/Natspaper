#!/usr/bin/env node
/**
 * Cross-platform script to copy pagefind directory
 * Works on Windows, macOS, and Linux
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, '../dist/pagefind');
const dest = path.join(__dirname, '../public/pagefind');

// Recursive copy function
function copyRecursive(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const files = fs.readdirSync(src);

  files.forEach(file => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    const stat = fs.statSync(srcFile);

    if (stat.isDirectory()) {
      // Recursively copy subdirectories
      copyRecursive(srcFile, destFile);
    } else {
      // Copy file
      fs.copyFileSync(srcFile, destFile);
    }
  });
}

try {
  copyRecursive(src, dest);
  // eslint-disable-next-line no-console
  console.log(`✓ Successfully copied pagefind from ${src} to ${dest}`);
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(`✗ Error copying pagefind: ${error.message}`);
  process.exit(1);
}
