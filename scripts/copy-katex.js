#!/usr/bin/env node
/**
 * Copy KaTeX CSS and fonts from node_modules to dist directory
 * This script runs after build to self-host KaTeX CSS and fonts locally
 * instead of fetching from CDN, eliminating render-blocking requests
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const katexCssSource = path.join(
  __dirname,
  '../node_modules/katex/dist/katex.min.css'
);
const katexFontsSource = path.join(
  __dirname,
  '../node_modules/katex/dist/fonts'
);
const katexDistDir = path.join(__dirname, '../dist/styles');
const katexPublicDir = path.join(__dirname, '../public/styles');
const katexCssDest = path.join(katexDistDir, 'katex.min.css');
const katexCssPublicDest = path.join(katexPublicDir, 'katex.min.css'); // Destination for dev server
const katexFontsDistDest = path.join(katexDistDir, 'fonts');
const katexFontsPublicDest = path.join(katexPublicDir, 'fonts');

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const files = fs.readdirSync(src);
  files.forEach((file) => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    if (fs.lstatSync(srcFile).isDirectory()) {
      copyDirectory(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}

function copyKaTeX() {
  try {
    // Create destination directories if they don't exist
    if (!fs.existsSync(katexDistDir)) {
      fs.mkdirSync(katexDistDir, { recursive: true });
      console.log(`📁 Created directory: ${katexDistDir}`);
    }
    if (!fs.existsSync(katexPublicDir)) {
      fs.mkdirSync(katexPublicDir, { recursive: true });
      console.log(`📁 Created directory: ${katexPublicDir}`);
    }

    // Check if source CSS file exists
    if (!fs.existsSync(katexCssSource)) {
      throw new Error(
        `KaTeX CSS file not found at: ${katexCssSource}\n` +
        'Make sure KaTeX is installed: pnpm install katex'
      );
    }

    // Copy the CSS file to dist
    fs.copyFileSync(katexCssSource, katexCssDest);
    console.log(`✓ Successfully copied KaTeX CSS to: ${katexCssDest}`);

    // Copy the CSS file to public for the dev server
    fs.copyFileSync(katexCssSource, katexCssPublicDest);
    console.log(`✓ Successfully copied KaTeX CSS to: ${katexCssPublicDest} (for dev server)`);

    // Verify the CSS copy
    const cssStats = fs.statSync(katexCssDest);
    console.log(`  CSS file size: ${(cssStats.size / 1024).toFixed(2)} KB`);

    // Copy fonts directory to both dist and public
    if (!fs.existsSync(katexFontsSource)) {
      throw new Error(
        `KaTeX fonts directory not found at: ${katexFontsSource}\n` +
        'Make sure KaTeX is installed: pnpm install katex'
      );
    }

    copyDirectory(katexFontsSource, katexFontsDistDest);
    console.log(`✓ Successfully copied KaTeX fonts to: ${katexFontsDistDest}`);

    copyDirectory(katexFontsSource, katexFontsPublicDest);
    console.log(`✓ Successfully copied KaTeX fonts to: ${katexFontsPublicDest}`);

    // Count fonts
    const fontFiles = fs.readdirSync(katexFontsDistDest);
    console.log(`  Copied ${fontFiles.length} font files`);

    return true;
  } catch (error) {
    console.error(`❌ Error copying KaTeX files: ${error.message}`);
    process.exit(1);
  }
}

// Run the copy
copyKaTeX();
