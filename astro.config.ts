import { defineConfig, fontProviders } from "astro/config";
import { getIntegrations } from "./config/integrations";
import { getViteConfig } from "./config/vite";
import { getEnvSchema } from "./config/env";
import { SITE } from "./src/config";
// NEW: Import directly from i18n config to avoid circular dependencies with src/config
import { DEFAULT_LANG, SUPPORTED_LANGS } from "./src/i18n/config";
// Disabled: remarkToc and remarkCollapse - using desktop sidebar TOC instead
// import remarkToc from "remark-toc";
// import remarkCollapse from "remark-collapse";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { remarkModifiedTime } from "./src/lib/remark/remark-modified-time.mjs";
import vercel from "@astrojs/vercel";

const siteUrl = process.env.SITE_WEBSITE || SITE.website;

export default defineConfig({
  site: siteUrl,
  output: "static",
  i18n: {
    defaultLocale: DEFAULT_LANG,
    locales: [...SUPPORTED_LANGS], // Spread to ensure mutability if needed by Astro types
    routing: {
      prefixDefaultLocale: true,
    },
  },
  integrations: getIntegrations(),
  markdown: {
    remarkPlugins: [
      remarkModifiedTime,
      remarkMath,
      // Disabled inline markdown TOC - using desktop sidebar TOC instead
      // [remarkToc, { heading: "(table of contents|შინაარსის ცხრილი)" }],
      // [remarkCollapse, { test: "(Table of contents|შინაარსის ცხრილი)" }],
    ],
    rehypePlugins: [rehypeKatex],
  },
  vite: getViteConfig(),
  env: getEnvSchema(),
  adapter: vercel({
    webAnalytics: {
      enabled: false,
    },
    imageService: true,
    imagesConfig: {
      // Limits strictly for free tier safety
      sizes: [320, 640, 1280],
      domains: [], // Add external domains if you fetch images from elsewhere
    },
  }),
  experimental: {
    preserveScriptOrder: true,
    contentIntellisense: true,
    headingIdCompat: true,
    fonts: [
      {
        name: "Inter",
        provider: fontProviders.fontsource(),
        weights: [400, 700],
        styles: ["normal"],
        cssVariable: "--font-inter",
        fallbacks: ["sans-serif"],
        display: "swap",
      },
      {
        name: "Noto Sans Georgian",
        provider: fontProviders.fontsource(),
        weights: [400, 700],
        styles: ["normal"],
        cssVariable: "--font-georgian",
        fallbacks: ["sans-serif"],
        display: "swap",
      },
      {
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
