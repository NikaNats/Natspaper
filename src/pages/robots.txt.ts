import type { APIRoute } from "astro";

/**
 * Robots.txt configuration for search engine crawlers
 *
 * This file is dynamically generated using Astro's API routes.
 * It tells search engines (Google, Bing, etc.) which pages they can crawl
 * and directs them to the sitemap-index.xml file.
 *
 * The sitemap-index.xml automatically includes all language variants (en, ka)
 * through Astro's i18n routing configuration, allowing crawlers to discover
 * and index all language versions of your content.
 *
 * Benefits of dynamic robots.txt:
 * - Uses the same site URL as configured in astro.config.ts
 * - No hardcoded domain that could become stale
 * - Automatically regenerated during builds
 *
 * Search engine crawling best practices implemented:
 * - Allow all pages (User-agent: *)
 * - Direct crawlers to sitemap for efficient discovery
 * - Language alternates handled via hreflang in sitemap XML
 */
const getRobotsTxt = (sitemapURL: URL) => `\
User-agent: *
Allow: /

# Sitemap directive guides search engines to all indexed pages including language variants
Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL("sitemap-index.xml", site);
  return new Response(getRobotsTxt(sitemapURL), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
