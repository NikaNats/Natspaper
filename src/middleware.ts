/**
 * Astro Middleware - Request handling and Sentry instrumentation
 *
 * This middleware handles:
 * 1. Sentry error tracking initialization (auto-instrumentation)
 * 2. Request-response context for better error tracking
 *
 * NOTE: With Astro 5.15.1 and @sentry/astro, the Sentry middleware is
 * automatically added via autoInstrumentation.requestHandler in astro.config.ts
 *
 * To customize Sentry behavior or add custom middleware, import and use
 * Sentry.handleRequest() with options as shown below.
 *
 * For more info on middleware:
 * @see https://docs.astro.build/en/guides/middleware/
 *
 * For Sentry server instrumentation:
 * @see https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#server-instrumentation
 */

import * as Sentry from "@sentry/astro";
import { sequence } from "astro:middleware";

/**
 * Sentry request handler middleware
 *
 * This is automatically added by the Sentry Astro integration when
 * autoInstrumentation.requestHandler is enabled in astro.config.ts
 *
 * Customize options here if needed:
 * - trackClientIp: Include client IP in error context (default: false)
 */
export const onRequest = sequence(
  Sentry.handleRequest({
    trackClientIp: false, // Set to true to include client IP (privacy impact)
  })
  // Add other middleware handlers here if needed
);
