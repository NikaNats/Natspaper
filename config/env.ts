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
  };
}