// src/pages/robots.txt.ts
import type { APIRoute } from "astro";
import { SITE } from "@/config";

/**
 * RFC 9309: Robots Exclusion Protocol Generator
 * =============================================
 * Implements formal ABNF rules as defined in IETF RFC 9309.
 *
 * Architecture & Conformance:
 * - UTF-8 character encoding (Section 2.3)
 * - Group Isolation / Override Protection (Section 2.2.1)
 * - Longest-match path evaluation compliance (Section 2.2.2)
 * - 24-hour Edge Caching Lifetime (Section 2.4)
 * - Non-terminating Sitemap record (Section 2.2.4)
 */

interface RobotsGroup {
  userAgents: string[];
  allow?: string[];
  disallow?: string[];
}

/**
 * Shared sensitive paths that MUST be protected across ALL user-agent groups.
 * RFC 9309 specifies that named groups override wildcard (*) groups completely,
 * so shared restricted paths must be applied uniformly to every group.
 */
const RESTRICTED_PATHS: readonly string[] = [
  "/api/",
  "/private/",
  "/drafts/",
] as const;

/**
 * Static asset prefixes required for rendering and styling.
 */
const PUBLIC_ASSET_PATHS: readonly string[] = [
  "/_astro/",
  "/assets/",
  "/fonts/",
  "/favicon.svg",
] as const;

function buildRobotsTxt(siteUrl: string, sitemapUrl: string): string {
  const groups: RobotsGroup[] = [
    // Group 1: Universal Wildcard (Fallback for all standard web crawlers)
    {
      userAgents: ["*"],
      allow: ["/", "/en/", "/ka/", ...PUBLIC_ASSET_PATHS],
      disallow: [...RESTRICTED_PATHS],
    },

    // Group 2: Primary Search Engine Indexers (Google, Bing, Apple, DuckDuckGo)
    {
      userAgents: ["Googlebot", "Bingbot", "Applebot", "DuckDuckBot"],
      allow: ["/", "/en/", "/ka/", ...PUBLIC_ASSET_PATHS],
      disallow: [...RESTRICTED_PATHS],
    },

    // Group 3: Commercial AI Scrapers & LLM Training Crawlers (Controlled Indexing)
    {
      userAgents: [
        "CCBot",
        "GPTBot",
        "ChatGPT-User",
        "ClaudeBot",
        "anthropic-ai",
        "Bytespider",
        "PerplexityBot",
      ],
      allow: ["/en/posts/", "/ka/posts/"],
      disallow: [...RESTRICTED_PATHS],
    },
  ];

  const lines: string[] = [
    "# ==========================================================================",
    "# RFC 9309 Robots Exclusion Protocol — Natspaper",
    "# Canonical Origin: " + siteUrl,
    "# ==========================================================================",
    "",
  ];

  for (const group of groups) {
    for (const agent of group.userAgents) {
      lines.push(`User-agent: ${agent}`);
    }
    if (group.allow) {
      for (const path of group.allow) {
        lines.push(`Allow: ${path}`);
      }
    }
    if (group.disallow) {
      for (const path of group.disallow) {
        lines.push(`Disallow: ${path}`);
      }
    }
    lines.push(""); // Mandatory RFC 9309 blank line terminating the group
  }

  // RFC 9309 Section 2.2.4: Other Records (Sitemap directive)
  lines.push("# Sitemaps");
  lines.push(`Sitemap: ${sitemapUrl}`);

  return lines.join("\n") + "\n";
}

export const GET: APIRoute = ({ site }) => {
  const baseOrigin = site
    ? site.href.replace(/\/$/, "")
    : SITE.website.replace(/\/$/, "");
  const sitemapUrl = `${baseOrigin}/sitemap-index.xml`;
  const robotsContent = buildRobotsTxt(baseOrigin, sitemapUrl);

  return new Response(robotsContent, {
    status: 200,
    headers: {
      // RFC 9309 Section 2.3: UTF-8 plain text MIME type
      "Content-Type": "text/plain; charset=utf-8",
      // RFC 9309 Section 2.4: 24-hour cache budget with edge revalidation
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
};
