import satori from "satori";
import { html } from "satori-html";
import { SITE } from "@/config";

export default async function generatePostOgImage(post) {
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

  // Load Inter 700 font from Fontsource CDN (same source that Astro's Fonts API uses)
  // This provides the same font that's configured in astro.config.ts
  // Using WOFF format instead of WOFF2 because Satori's font parser (opentype.js)
  // can read WOFF (Web Open Font Format), which wraps TrueType data.
  // WOFF2 is more compressed but incompatible with opentype.js.
  const fontResponse = await fetch(
    "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.2.8/files/inter-latin-700-normal.woff"
  );
  const fontBuffer = await fontResponse.arrayBuffer();

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
