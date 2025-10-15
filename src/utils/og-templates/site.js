import satori from "satori";
import { html } from "satori-html";
import { SITE } from "@/config";
import loadGoogleFonts from "../loadGoogleFont";

export default async function generateSiteOgImage() {
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
        <div
          style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 90%; max-height: 90%; overflow: hidden; text-align: center;"
        >
          <p style="font-size: 72px; font-weight: bold;">${SITE.title}</p>
          <p style="font-size: 28px;">${SITE.desc}</p>
        </div>
        <div
          style="display: flex; justify-content: flex-end; width: 100%; margin-bottom: 8px; font-size: 28px;"
        >
          <span style="overflow: hidden; font-weight: bold;">
            ${new URL(SITE.website).hostname}
          </span>
        </div>
      </div>
    </div>
  </div>`;

  return satori(markup, {
    width: 1200,
    height: 630,
    embedFont: true,
    fonts: await loadGoogleFonts(SITE.title + SITE.desc + SITE.website),
  });
}
