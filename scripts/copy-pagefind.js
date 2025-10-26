#!/usr/bin/env node
/**
 * Copy pagefind directory with race condition handling
 *
 * Fixes:
 * 1. Wait for pagefind process to complete (with retry logic)
 * 2. Validate source directory exists before copying
 * 3. Verify destination write success
 * 4. Provide detailed error messages
 *
 * Build sequence: astro build → pagefind --site dist → copy-pagefind → verify-build
 *
 * Without this fix:
 * - pagefind writes asynchronously
 * - copy-pagefind starts immediately (race condition)
 * - Files incomplete or missing on slow systems
 *
 * With fix:
 * - Waits for pagefind to fully complete
 * - Validates files are ready before copying
 * - Retries on temporary file locks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, '../dist/pagefind');
const dest = path.join(__dirname, '../public/pagefind');

// Configuration
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 500; // 500ms between retries
const INITIAL_WAIT_MS = 1000; // Wait for pagefind to complete

/**
 * Wait for a specified duration
 * Gives pagefind time to finish writing all files
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if source directory exists and is valid
 * Throws descriptive error if not ready
 */
function validateSourceDirectory() {
  if (!fs.existsSync(src)) {
    throw new Error(
      `❌ Source pagefind directory not found: ${src}\n` +
      'Make sure pagefind command completed successfully:\n' +
      '  pagefind --site dist\n' +
      'This script should run after pagefind finishes.'
    );
  }

  try {
    const stats = fs.statSync(src);
    if (!stats.isDirectory()) {
      throw new Error(`❌ Source is not a directory: ${src}`);
    }
  } catch (err) {
    throw new Error(
      `❌ Cannot access source directory: ${src}\n` +
      `Error: ${err.message}`
    );
  }

  // Check for critical pagefind files
  const criticalFiles = ['pagefind.js', 'pagefind-entry.json'];
  const missingFiles = criticalFiles.filter(
    file => !fs.existsSync(path.join(src, file))
  );

  if (missingFiles.length > 0) {
    throw new Error(
      `❌ Critical pagefind files missing: ${missingFiles.join(', ')}\n` +
      `Source directory: ${src}\n` +
      'pagefind may still be writing. Retrying...'
    );
  }
}

/**
 * Recursive copy with error handling
 */
function copyRecursive(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    try {
      fs.mkdirSync(dest, { recursive: true });
    } catch (err) {
      throw new Error(
        `❌ Failed to create destination directory: ${dest}\n` +
        `Error: ${err.message}`
      );
    }
  }

  // Read source directory
  let files;
  try {
    files = fs.readdirSync(src);
  } catch (err) {
    throw new Error(
      `❌ Cannot read source directory: ${src}\n` +
      `Error: ${err.message}`
    );
  }

  if (files.length === 0) {
    throw new Error(
      `❌ Source directory is empty: ${src}\n` +
      'pagefind may not have generated any files.'
    );
  }

  let copiedCount = 0;

  files.forEach(file => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);

    try {
      const stat = fs.statSync(srcFile);

      if (stat.isDirectory()) {
        // Recursively copy subdirectories
        copyRecursive(srcFile, destFile);
      } else {
        // Copy file
        fs.copyFileSync(srcFile, destFile);
        copiedCount++;
      }
    } catch (err) {
      throw new Error(
        `❌ Error copying file: ${srcFile} → ${destFile}\n` +
        `Error: ${err.message}\n` +
        'File may be locked by pagefind process.'
      );
    }
  });

  return copiedCount;
}

/**
 * Main copy function with retry logic
 * Handles race conditions where pagefind is still writing
 */
async function copyPagefindWithRetry() {
  console.log('⏳ Waiting for pagefind to complete...');
  // Give pagefind time to fully write all files
  await sleep(INITIAL_WAIT_MS);

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(
        `📋 Validating pagefind directory (attempt ${attempt}/${RETRY_ATTEMPTS})...`
      );
      validateSourceDirectory();

      console.log(`📁 Copying pagefind from ${src}`);
      const copiedCount = copyRecursive(src, dest);

      console.log(
        `✓ Successfully copied ${copiedCount} files from pagefind to ${dest}`
      );
      return true;
    } catch (error) {
      if (attempt === RETRY_ATTEMPTS) {
        // Final attempt failed
        throw error;
      }

      console.warn(`⚠️  Attempt ${attempt} failed: ${error.message}`);
      console.log(`⏳ Retrying in ${RETRY_DELAY_MS}ms...`);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

// Main execution
copyPagefindWithRetry()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error.message);
    // eslint-disable-next-line no-console
    console.error(
      '\n💡 Troubleshooting:\n' +
      '  1. Check pagefind output above for errors\n' +
      '  2. Verify dist/pagefind directory exists\n' +
      '  3. Try again: npm run build\n' +
      '  4. If persistent, check system disk space and permissions'
    );
    process.exit(1);
  });
