import satori from "satori";
import { html } from "satori-html";
import { SITE } from "@/config";
import type { CollectionEntry } from "astro:content";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// ============================================================================
// 1. FONTS (read once per build, hermetic: no CDN)
// ============================================================================
// Satori needs every script it renders to be covered by a font, otherwise it
// draws "NO GLYPH" boxes. Inter covers Latin; Noto Sans Georgian covers the
// Georgian (ka) titles. Satori falls back through the list per glyph.
const FONT_FILES = [
  { name: "Inter", path: "public/fonts/inter-latin-700-normal.woff" },
  {
    name: "Noto Sans Georgian",
    path: "node_modules/@fontsource/noto-sans-georgian/files/noto-sans-georgian-georgian-700-normal.woff",
  },
] as const;

type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 700;
  style: "normal";
};

let fontsPromise: Promise<SatoriFont[]> | null = null;

async function readFont(relativePath: string): Promise<ArrayBuffer> {
  const buffer = await readFile(join(process.cwd(), relativePath));
  return Uint8Array.from(buffer).buffer;
}

function loadFonts(): Promise<SatoriFont[]> {
  fontsPromise ??= Promise.all(
    FONT_FILES.map(async ({ name, path }) => ({
      name,
      data: await readFont(path),
      weight: 700 as const,
      style: "normal" as const,
    }))
  ).catch(error => {
    fontsPromise = null; // allow a retry instead of caching the failure
    console.error("❌ [OG Image] Failed to load fonts:", error);
    throw error;
  });
  return fontsPromise;
}

/** Step the title size down so long (and wide-glyph Georgian) titles fit. */
function titleFontSize(title: string): number {
  if (title.length <= 40) return 72;
  if (title.length <= 60) return 60;
  return 52;
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
          style="font-size: ${titleFontSize(post.data.title)}px; font-weight: bold; max-height: 84%; overflow: hidden;"
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
