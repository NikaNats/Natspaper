import { envField } from "astro/config";
import { SITE } from "../src/config";

export function getEnvSchema() {
  return {
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

      // Giscus Comments Configuration
      // Get these values from https://giscus.app/
      PUBLIC_GISCUS_REPO: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      PUBLIC_GISCUS_REPO_ID: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      PUBLIC_GISCUS_CATEGORY: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      PUBLIC_GISCUS_CATEGORY_ID: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  };
}