/**
 * Astro Middleware - Request handling and Sentry instrumentation
 *
 * This middleware handles:
 * 1. SEO: X-Robots-Tag noindex for Vercel preview deployments
 * 2. Sentry error tracking initialization (auto-instrumentation)
 * 3. Request-response context for better error tracking
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
import { defineMiddleware, sequence } from "astro:middleware";

/**
 * SEO: Prevent search engine indexing of preview/staging environments
 *
 * Vercel preview deployments have VERCEL_ENV !== "production"
 * This adds X-Robots-Tag: noindex to prevent indexing non-production content
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/block-indexing
 */
const noIndexPreviewMiddleware = defineMiddleware(async (_, next) => {
  const response = await next();

  // Add noindex header for non-production Vercel environments
  const vercelEnv = import.meta.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== "production") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
});

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
  noIndexPreviewMiddleware,
  Sentry.handleRequest({
    trackClientIp: false, // Set to true to include client IP (privacy impact)
  })
  // Add other middleware handlers here if needed
);
