import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import sentry from "@sentry/astro";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { envValidationIntegration } from "./src/integrations/envValidation";
import { SITE } from "./src/config";

// Get site URL from environment or use default from config
const siteUrl = process.env.SITE_WEBSITE || SITE.website;

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  output: "static", // Fully static build - no server-side rendering
  integrations: [
    envValidationIntegration(),
    sitemap({
      filter: page => SITE.showArchives || !page.endsWith("/archives"),
    }),
    sentry({
      // Configuration for source map uploads during build
      // Enables readable stack traces in production by uploading source maps
      sourceMapsUploadOptions: {
        project: "natspaper",
        org: "nika-1u",
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },

      // Auto instrumentation for request handling (Astro 3.5.2+)
      // Automatically adds middleware for request tracking and distributed tracing
      autoInstrumentation: {
        requestHandler: true,
      },
    }),
  ],
  markdown: {
    remarkPlugins: [
      remarkMath,
      remarkToc,
      [remarkCollapse, { test: "Table of contents" }],
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
  vite: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [tailwindcss() as any],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
  env: {
    schema: {
      // ========================================
      // Server-side (Private) Environment Variables
      // ========================================
      SITE_WEBSITE: envField.string({
        access: "secret",
        context: "server",
        optional: true, // Optional: falls back to SITE.website from config.ts
        default: SITE.website,
      }),
      SENTRY_AUTH_TOKEN: envField.string({
        access: "secret",
        context: "server",
        optional: true, // Optional: only needed if using Sentry integration
      }),
      SENTRY_DSN: envField.string({
        access: "secret",
        context: "server",
        optional: true, // Optional: for server-side error tracking
      }),
      SENTRY_TRACE_SAMPLE_RATE: envField.string({
        access: "secret",
        context: "server",
        optional: true, // Optional: defaults to 0.1 in production
      }),
      NODE_ENV: envField.string({
        access: "secret",
        context: "server",
        optional: true, // Optional: auto-detected by Astro
      }),
      BUILD_TIMESTAMP: envField.string({
        access: "secret",
        context: "server",
        optional: true, // Optional: build metadata
      }),
      BUILD_VERSION: envField.string({
        access: "secret",
        context: "server",
        optional: true, // Optional: build metadata
      }),

      // ========================================
      // Client-side (Public) Environment Variables
      // ========================================
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true, // Optional: only if using Google Search Console
      }),
      PUBLIC_SENTRY_DSN: envField.string({
        access: "public",
        context: "client",
        optional: true, // Optional: for client-side error tracking
      }),
    },
  },
  experimental: {
    preserveScriptOrder: true,
    // CSP is configured via Vercel HTTP headers (vercel.json)
    // Not using Astro's CSP meta tag generation to avoid conflicts with dynamic styles
    // from ClientRouter which can't be pre-hashed
  },
});
