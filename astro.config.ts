import { defineConfig } from "astro/config";
import { getIntegrations } from "./config/integrations";
import { getViteConfig } from "./config/vite";
import { getEnvSchema } from "./config/env";
import { SITE } from "./src/config";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { remarkModifiedTime } from "./src/lib/remark/remark-modified-time.mjs";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { fontProviders } from "astro/config";

// Get site URL from environment or use default from config
const siteUrl = process.env.SITE_WEBSITE || SITE.website;

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  output: "static", // Fully static build - no server-side rendering

  // Internationalization (i18n) Configuration
  // - defaultLocale: 'en' sets English as the default language
  // - locales: ['en', 'ka'] defines supported languages (English and Georgian)
  // - prefixDefaultLocale: true ensures all URLs, including English, have a language prefix (e.g., /en/about)
  //   This creates a consistent URL structure across all languages and is highly recommended for SEO
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ka"],
    routing: {
      prefixDefaultLocale: true,
    },
  },

  // Import configurations from dedicated modules
  integrations: getIntegrations(),
  markdown: {
    remarkPlugins: [
      remarkModifiedTime,
      remarkMath,
      [remarkToc, { heading: "(table of contents|შინაარსის ცხრილი)" }],
      [remarkCollapse, { test: "(Table of contents|შინაარსის ცხრილი)" }],
    ],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: getViteConfig(),
  env: getEnvSchema(),
  experimental: {
    preserveScriptOrder: true,
    contentIntellisense: true,
    headingIdCompat: true,
    fonts: [
      {
        // Body & UI Font
        name: "Inter",
        provider: fontProviders.fontsource(),
        weights: [400, 700], // The exact weights you use
        styles: ["normal"],
        cssVariable: "--font-inter", // We will use this in our CSS
        fallbacks: ["sans-serif"],
        display: "swap", // Same behavior as your old setup
      },
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
    // CSP is configured via Vercel HTTP headers (vercel.json)
    // Not using Astro's CSP meta tag generation to avoid conflicts with dynamic styles
    // from ClientRouter which can't be pre-hashed
  },

  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
});
