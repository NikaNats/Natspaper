#!/usr/bin/env node
/**
 * Copy Fontsource fonts from node_modules to public directory
 * This ensures fonts are accessible at absolute paths like /files/... 
 * instead of relative paths that break on language-prefixed routes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fontSources = {
  inter: path.join(__dirname, '../node_modules/@fontsource/inter/files'),
  merriweather: path.join(__dirname, '../node_modules/@fontsource/merriweather/files'),
  jetbrainsMono: path.join(__dirname, '../node_modules/@fontsource/jetbrains-mono/files'),
};

const fontsPublicDir = path.join(__dirname, '../public/files');

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

function copyFontsource() {
  try {
    // Create destination directory
    if (!fs.existsSync(fontsPublicDir)) {
      fs.mkdirSync(fontsPublicDir, { recursive: true });
      console.log(`📁 Created directory: ${fontsPublicDir}`);
    }

    // Copy all font sources
    for (const [fontName, fontSource] of Object.entries(fontSources)) {
      if (!fs.existsSync(fontSource)) {
        console.warn(`⚠️  Font source not found: ${fontSource}`);
        continue;
      }

      copyDirectory(fontSource, fontsPublicDir);
      console.log(`✓ Successfully copied ${fontName} fonts to: ${fontsPublicDir}`);
    }

    // Count total fonts
    const fontFiles = fs.readdirSync(fontsPublicDir);
    console.log(`\n✓ Total font files: ${fontFiles.length}`);

    return true;
  } catch (error) {
    console.error(`❌ Error copying Fontsource fonts: ${error.message}`);
    process.exit(1);
  }
}

// Run the copy
copyFontsource();
