import satori from "satori";
import { html } from "satori-html";
import { SITE } from "@/config";
import type { CollectionEntry } from "astro:content";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// ============================================================================
// 1. MODULE-LEVEL CACHE
// ============================================================================
// Cache the buffer in memory so we only read from disk once per build.
let fontBuffer: ArrayBuffer | null = null;

/**
 * Local Font Loader
 * Reads the font file from the filesystem (hermetic build—no CDN dependency).
 */
async function loadFont(): Promise<ArrayBuffer> {
  if (fontBuffer) {
    return fontBuffer;
  }

  try {
    // Resolve path relative to the current working directory (project root)
    const fontPath = join(
      process.cwd(),
      "public/fonts/inter-latin-700-normal.woff"
    );

    // Read file as a Node Buffer
    const fileBuffer = await readFile(fontPath);

    // Convert Node Buffer to ArrayBuffer (required by Satori)
    fontBuffer = Uint8Array.from(fileBuffer).buffer;

    return fontBuffer;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ [OG Image] Failed to load local font:", error);
    throw error;
  }
}

// ============================================================================
// 2. MAIN GENERATOR
// ============================================================================

export default async function generatePostOgImage(
  post: CollectionEntry<"blog">
) {
  // Load font from disk
  const fontData = await loadFont();

  const markup = html`<div
    style="background-color: #fefbfb; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"
  >
    <div
      style="position: absolute; top: -1px; right: -1px; border: 4px solid #000; background: #ecebeb; opacity: 0.9; border-radius: 4px; display: flex; justify-content: center; margin: 2.5rem; width: 88%; height: 80%;"
    ></div>

    <div
      style="border: 4px solid #000; background: #fefbfb; border-radius: 4px; display: flex; justify-content: center; margin: 2rem; width: 88%; height: 80%;"
    >
      <div
        style="display: flex; flex-direction: column; justify-content: space-between; margin: 20px; width: 90%; height: 90%;"
      >
        <p
          style="font-size: 72px; font-weight: bold; max-height: 84%; overflow: hidden;"
        >
          ${post.data.title}
        </p>
        <div
          style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 8px; font-size: 28px;"
        >
          <span>
            by
            <span style="color: transparent;">"</span>
            <span style="overflow: hidden; font-weight: bold;"
              >${post.data.author}</span
            >
          </span>

          <span style="overflow: hidden; font-weight: bold;"
            >${SITE.title}</span
          >
        </div>
      </div>
    </div>
  </div>`;

  return satori(markup, {
    width: 1200,
    height: 630,
    embedFont: true,
    fonts: [
      {
        name: "Inter",
        data: fontData,
        weight: 700,
        style: "normal",
      },
    ],
  });
}
