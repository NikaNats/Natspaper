import type { APIRoute } from "astro";

/**
 * Robots.txt configuration for search engine crawlers
 * 
 * The sitemap-index.xml will include all language variants (en, ka)
 * automatically, allowing crawlers to discover all language versions.
 * Astro's sitemap integration handles this for us with i18n routing.
 */
const getRobotsTxt = (sitemapURL: URL) => `
User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL("sitemap-index.xml", site);
  return new Response(getRobotsTxt(sitemapURL));
};
