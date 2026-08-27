// src/middleware.ts
import { defineMiddleware } from "astro:middleware";

/**
 * HTTP Protocol Middleware: RFC 9309 & Search Engine Hygiene
 *
 * For non-production deployments (Vercel previews, staging, development),
 * injects RFC 8288 / Google Search compliant X-Robots-Tag headers to prevent
 * accidental duplicate content indexing.
 */
export const onRequest = defineMiddleware(async (_, next) => {
  const response = await next();

  const vercelEnv = import.meta.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== "production") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return response;
});
