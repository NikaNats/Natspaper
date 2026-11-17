import satori from "satori";
import { html } from "satori-html";
import { SITE } from "@/config";
import type { CollectionEntry } from "astro:content";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";

// ============================================================================
// 1. FONTS (module-level cache: read from disk once per build)
// ============================================================================
// Satori has no system fonts: every glyph must come from a font passed in.
// Inter Latin has no Georgian block (U+10A0–U+10FF), so Georgian titles and
// author names rendered as tofu. Satori falls back across the `fonts` list per
// glyph, so Inter stays primary and Noto Sans Georgian covers Georgian.
// Satori accepts TTF/OTF/WOFF (not WOFF2).
const require = createRequire(join(process.cwd(), "package.json"));

const FONT_SOURCES = [
  {
    name: "Inter",
    path: join(process.cwd(), "public/fonts/inter-latin-700-normal.woff"),
  },
  {
    name: "Noto Sans Georgian",
    // Resolved through the package's `exports` map (hermetic: no CDN).
    path: require.resolve("@fontsource/noto-sans-georgian/files/noto-sans-georgian-georgian-700-normal.woff"),
  },
] as const;

type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 700;
  style: "normal";
};

let fontsPromise: Promise<SatoriFont[]> | null = null;

/** Load all OG fonts once; concurrent callers share one in-flight read. */
function loadFonts(): Promise<SatoriFont[]> {
  fontsPromise ??= Promise.all(
    FONT_SOURCES.map(async ({ name, path }) => {
      const file = await readFile(path);
      return {
        name,
        // Copy into a standalone ArrayBuffer (Satori requires ArrayBuffer)
        data: Uint8Array.from(file).buffer,
        weight: 700 as const,
        style: "normal" as const,
      };
    })
  ).catch(error => {
    fontsPromise = null; // allow a retry instead of caching the failure
    console.error("❌ [OG Image] Failed to load local fonts:", error);
    throw error;
  });
  return fontsPromise;
}

// ============================================================================
// 2. MAIN GENERATOR
// ============================================================================

export default async function generatePostOgImage(
  post: CollectionEntry<"blog">
) {
  const fonts = await loadFonts();

  const markup = html`<div
    style="background-color: #fefbfb; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"
  >
    <div
      style="position: absolute; top: -1px; right: -1px; border: 4px solid #000; background: #ecebeb; opacity: 0.9; border-radius: 4px; display: flex; justify-content: center; margin: 2.5rem; width: 88%; height: 80%;"
    ></div>

    <div
      style="position: relative; border: 4px solid #000; background: #fefbfb; border-radius: 4px; display: flex; justify-content: center; margin: 2rem; width: 88%; height: 80%;"
    >
      <div
        style="display: flex; flex-direction: column; justify-content: space-between; margin: 20px; width: 90%; height: 90%;"
      >
        <p
          style="display: block; font-size: 64px; font-weight: bold; line-height: 1.25; line-clamp: 3; overflow: hidden;"
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
    fonts,
  });
}
