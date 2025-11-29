/**
 * Astro Middleware - Request handling
 *
 * This middleware handles:
 * 1. SEO: X-Robots-Tag noindex for Vercel preview deployments
 *
 * For more info on middleware:
 * @see https://docs.astro.build/en/guides/middleware/
 */

import { defineMiddleware } from "astro:middleware";

/**
 * SEO: Prevent search engine indexing of preview/staging environments
 *
 * Vercel preview deployments have VERCEL_ENV !== "production"
 * This adds X-Robots-Tag: noindex to prevent indexing non-production content
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/block-indexing
 */
export const onRequest = defineMiddleware(async (_, next) => {
  const response = await next();

  // Add noindex header for non-production Vercel environments
  const vercelEnv = import.meta.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== "production") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
});
