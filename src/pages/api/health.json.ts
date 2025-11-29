/**
 * Health Check Endpoint
 * =====================
 * Lightweight endpoint for uptime monitoring services (UptimeRobot, BetterStack, etc.)
 *
 * AVAILABILITY RISK: Without a health endpoint, uptime monitors can only verify
 * that DNS resolves, not that the application is actually serving content.
 *
 * This endpoint returns:
 * - status: "ok" if the site is operational
 * - timestamp: ISO 8601 timestamp for response freshness verification
 * - version: Build version for deployment tracking
 *
 * Usage:
 * - GET /api/health.json
 * - Expected response: 200 OK with JSON body
 * - Any non-200 response indicates the site is down
 *
 * @example
 * // UptimeRobot configuration:
 * // URL: https://yoursite.com/api/health.json
 * // Keyword: "ok"
 * // Interval: 5 minutes
 */

import type { APIRoute } from "astro";

// Force static generation for Edge availability
// This endpoint is pre-rendered at build time for instant response
export const prerender = true;

export const GET: APIRoute = () => {
  const healthResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
    environment: process.env.NODE_ENV || "development",
    uptime: "static", // Indicates this is a static site (always "up" if CDN is up)
  };

  return new Response(JSON.stringify(healthResponse, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Short cache to ensure monitors get fresh responses
      // but still leverage Edge caching
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
};
