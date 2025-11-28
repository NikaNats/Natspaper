import satori from "satori";
import { html } from "satori-html";
import { SITE } from "@/config";
import type { CollectionEntry } from "astro:content";

// ============================================================================
// 1. MODULE-LEVEL CACHE (The Fix)
// ============================================================================
// We cache the PROMISE, not just the buffer. This prevents "race conditions"
// where 5 posts start generating simultaneously and all 5 trigger a fetch
// before the first one finishes.
let fontPromise: Promise<ArrayBuffer> | null = null;

const FONT_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.2.8/files/inter-latin-700-normal.woff";

/**
 * Singleton Font Loader
 * Ensures we only hit the CDN once per build, regardless of post count.
 */
async function loadFont(): Promise<ArrayBuffer> {
  // Return existing promise if fetch is already in progress or completed
  if (fontPromise) {
    return fontPromise;
  }

  // Initialize the fetch (Lazy Loading)
  fontPromise = fetch(FONT_URL)
    .then(response => {
      if (!response.ok) {
        throw new Error(
          `Failed to fetch font: ${response.status} ${response.statusText}`
        );
      }
      return response.arrayBuffer();
    })
    .catch(err => {
      // Critical: If fetch fails, clear cache so we can retry on next attempt
      // Otherwise, the build stays broken for all subsequent posts.
      fontPromise = null;
      throw err;
    });

  return fontPromise;
}

// ============================================================================
// 2. MAIN GENERATOR
// ============================================================================

export default async function generatePostOgImage(
  post: CollectionEntry<"blog">
) {
  // Load font from cache (or fetch if first time)
  // This is now safe to call 1000 times in a loop.
  const fontBuffer = await loadFont();

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
        data: fontBuffer,
        weight: 700,
        style: "normal",
      },
    ],
  });
}
