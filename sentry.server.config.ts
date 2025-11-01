import * as Sentry from "@sentry/astro";

/**
 * Server-side Sentry initialization (Node.js runtime)
 *
 * Captures errors and performance data from server-side rendering,
 * API routes, and server functions in your Astro application.
 *
 * Configuration is loaded from environment variables:
 * - SENTRY_DSN: Private server DSN (or falls back to PUBLIC_SENTRY_DSN)
 * - SENTRY_TRACE_SAMPLE_RATE: % of transactions to sample (0-1)
 */

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.PUBLIC_SENTRY_DSN,

  // Collects request headers and user IP address (server-side)
  // Set to false to protect user privacy (default: false)
  // Only enable if you've explicitly decided to collect this data
  sendDefaultPii: false,

  // Attach stack traces to all events for better debugging
  attachStacktrace: true,
});
