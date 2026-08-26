import { defineConfig, sharpImageService } from "astro/config";
import { getIntegrations } from "./config/integrations";
import { getViteConfig } from "./config/vite";
import { getEnvSchema } from "./config/env";
import { SITE } from "./src/config";
import { DEFAULT_LANG, SUPPORTED_LANGS } from "./src/i18n/config";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { remarkModifiedTime } from "./src/lib/remark-modified-time.mjs";
import vercel from "@astrojs/vercel";

const siteUrl = process.env.SITE_WEBSITE || SITE.website;

export default defineConfig({
  site: siteUrl,
  output: "static",
  // PERFORMANCE: Enable HTML compression
  compressHTML: true,
  // PERFORMANCE: Prefetch configuration for faster navigation
  prefetch: {
    defaultStrategy: "hover",
    prefetchAll: false,
  },
  i18n: {
    defaultLocale: DEFAULT_LANG,
    locales: [...SUPPORTED_LANGS],
    routing: {
      prefixDefaultLocale: true,
    },
  },
  integrations: getIntegrations(),

  markdown: {
    remarkPlugins: [remarkModifiedTime, remarkMath],
    rehypePlugins: [
      [
        rehypeKatex,
        {
          // Output only pure W3C MathML Core markup (<math>, <mrow>, <mfrac>, etc.)
          // Suppresses all legacy .katex-html DOM overhead
          output: "mathml",
          strict: true,
          throwOnError: false,
        },
      ],
    ],
  },

  vite: getViteConfig(),
  env: getEnvSchema(),
  // PERFORMANCE: Build optimizations
  build: {
    inlineStylesheets: "auto",
  },
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
    // imageService: false უზრუნველყოფს სურათების 100% სტატიკურ გენერაციას dist/_astro/-ში
    imageService: false,
  }),
  image: {
    service: sharpImageService(),
    responsiveStyles: true,
    layout: "constrained",
  },
});
