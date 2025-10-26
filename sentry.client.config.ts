import * as Sentry from "@sentry/astro";

/**
 * Client-side Sentry Configuration
 * 
 * Initialize Sentry for client-side error tracking if DSN is provided
 * 
 * Environment variables:
 * - PUBLIC_SENTRY_DSN: Client-side Sentry DSN (required for error tracking)
 *   Must be prefixed with PUBLIC_ to be accessible in browser
 * 
 * @see https://docs.sentry.io/platforms/javascript/guides/astro/
 */

if (globalThis.window && import.meta.env.PUBLIC_SENTRY_DSN) {
  const environment = import.meta.env.MODE || "production";
  const isProduction = environment === "production";

  Sentry.init({
    dsn: import.meta.env.PUBLIC_SENTRY_DSN,
    environment,
    tracesSampleRate: isProduction ? 0.1 : 1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    // Attach stack traces to all messages
    attachStacktrace: true,
  });
}

export * from "@sentry/astro";
