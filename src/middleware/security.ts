/**
 * Security Headers Middleware
 * Applies Content Security Policy and other security headers to all responses.
 * 
 * This middleware runs on every request and adds:
 * - Content-Security-Policy (prevents XSS)
 * - X-Frame-Options (prevents clickjacking)
 * - X-Content-Type-Options (prevents MIME sniffing)
 * - And other security headers
 * 
 * Environment-aware:
 * - Development: Allows unsafe-inline for debugging
 * - Production: Strict policy with no unsafe-inline
 */

import { defineMiddleware } from "astro:middleware";
import {
  getSecurityHeaders,
  formatSecurityHeaders,
} from "@/utils/securityHeaders";

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  // Get security headers for current environment
  const isProduction = import.meta.env.PROD;
  const headers = getSecurityHeaders(isProduction);
  const formattedHeaders = formatSecurityHeaders(headers);

  // Apply security headers to response
  for (const [key, value] of Object.entries(formattedHeaders)) {
    response.headers.set(key, value);
  }

  return response;
});
