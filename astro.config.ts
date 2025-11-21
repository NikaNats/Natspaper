import { defineConfig, fontProviders } from "astro/config"; // Ensure fontProviders is imported
import { getIntegrations } from "./config/integrations";
import { getViteConfig } from "./config/vite";
import { getEnvSchema } from "./config/env";
import { SITE } from "./src/config";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { remarkModifiedTime } from "./src/lib/remark/remark-modified-time.mjs";

const siteUrl = process.env.SITE_WEBSITE || SITE.website;

export default defineConfig({
  site: siteUrl,
  output: "static",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ka"],
    routing: {
      prefixDefaultLocale: true,
    },
  },
  integrations: getIntegrations(),
  markdown: {
    remarkPlugins: [
      remarkModifiedTime,
      remarkMath,
      [remarkToc, { heading: "(table of contents|შინაარსის ცხრილი)" }],
      [remarkCollapse, { test: "(Table of contents|შინაარსის ცხრილი)" }],
    ],
    rehypePlugins: [rehypeKatex],
  },
  vite: getViteConfig(),
  env: getEnvSchema(),
  experimental: {
    preserveScriptOrder: true,
    contentIntellisense: true,
    headingIdCompat: true,
    fonts: [
      {
        // English / Default Body
        name: "Inter",
        provider: fontProviders.fontsource(),
        weights: [400, 700],
        styles: ["normal"],
        cssVariable: "--font-inter",
        fallbacks: ["sans-serif"],
        display: "swap",
      },
      // START OF NEW CONFIG
      {
        // Georgian Font
        name: "Noto Sans Georgian",
        provider: fontProviders.fontsource(),
        weights: [400, 700],
        styles: ["normal"],
        // This variable name MUST match what is in Layout.astro
        cssVariable: "--font-georgian",
        fallbacks: ["sans-serif"],
        display: "swap",
      },
      // END OF NEW CONFIG
      {
        // Code Font
        name: "JetBrains Mono",
        provider: fontProviders.fontsource(),
        weights: [400],
        styles: ["normal"],
        cssVariable: "--font-jetbrains-mono",
        fallbacks: ["monospace"],
        display: "swap",
      },
    ],
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
});
