/// <reference types="astro/client" />

import sitemap, { ChangeFreqEnum } from "@astrojs/sitemap";
import Sonda from "sonda/astro";
import expressiveCode from "astro-expressive-code";
import { envValidationIntegration } from "../src/integrations/envValidation";
import { finalizeDistIntegration } from "../src/integrations/finalizeDist";
import { validateMathMLIntegration } from "../src/integrations/validateMathML";
import { FEATURES } from "../src/config";
import {
  DEFAULT_LANG,
  LOCALE_CODES,
  SUPPORTED_LANGS,
} from "../src/i18n/config";
import { buildPostLastmodMap, lastmodForUrl } from "./sitemapLastmod";

export function getIntegrations() {
  const postLastmod = buildPostLastmodMap(SUPPORTED_LANGS, DEFAULT_LANG);

  // Build sitemap locales map from LOCALE_CODES
  const sitemapLocales: Record<string, string> = {};
  for (const [lang, code] of Object.entries(LOCALE_CODES)) {
    sitemapLocales[lang] = code;
  }

  const integrations = [
    envValidationIntegration(),
    finalizeDistIntegration(),
    validateMathMLIntegration(),
    sitemap({
      // SEO: Filter configuration - exclude pages that shouldn't be indexed
      filter: page => {
        // Exclude archive pages if showArchives feature is disabled
        if (!FEATURES.showArchives && page.endsWith("/archives")) return false;

        // Exclude 404 error pages from sitemap
        if (page.includes("/404")) return false;

        // Exclude the bare origin: src/pages/index.astro is a noindex
        // language-redirect stub, and sitemaps must list only canonical,
        // indexable URLs (/en/ and /ka/ are those).
        if (new URL(page).pathname === "/") return false;

        return true;
      },

      // Internationalization support for multi-language sitemaps
      // Automatically generates alternate language links (hreflang)
      // Uses locale codes from i18n config for consistency
      i18n: {
        defaultLocale: DEFAULT_LANG,
        locales: sitemapLocales,
      },

      // SEO: Serialize function to customize sitemap entries
      // Google uses lastmod to determine crawl priority
      serialize: item => {
        // lastmod only where it is accurate (posts: modDatetime ?? pubDatetime).
        // A build-time stamp on every URL makes crawlers distrust lastmod.
        const lastmod = lastmodForUrl(item.url, postLastmod);
        if (lastmod) item.lastmod = lastmod;
        else delete item.lastmod;

        // Note: changefreq and priority are ignored by Google but kept for other crawlers
        // Homepage and main sections get higher priority
        const url = item.url;
        if (
          url.endsWith("/en/") ||
          url.endsWith("/ka/") ||
          url.includes("/posts")
        ) {
          item.changefreq = ChangeFreqEnum.WEEKLY;
          item.priority = 0.8;
        } else if (url.includes("/tags") || url.includes("/archives")) {
          item.changefreq = ChangeFreqEnum.WEEKLY;
          item.priority = 0.6;
        } else {
          item.changefreq = ChangeFreqEnum.MONTHLY;
          item.priority = 0.5;
        }

        return item;
      },

      // Namespace optimization - exclude unused XML namespaces
      // Reduces sitemap file size and improves parsing speed
      namespaces: {
        news: false, // Not using news content
        image: false, // Not using image sitemap
        video: false, // Not using video sitemap
        xhtml: true, // Keep xhtml for language alternates (hreflang)
      },

      // Set reasonable entry limit (default is 45,000)
      // At typical blog scale, a single sitemap-0.xml is sufficient
      entryLimit: 45000,
    }),
    // Use external `ec.config.mjs` for Expressive Code configuration where possible.
    // This avoids duplicating settings and allows you to use <Code /> safely in .astro/.mdx
    // Keep inline options out of the integration so the external config file is the single source of truth.
    expressiveCode(),
    Sonda({
      format: ["html", "json"],
    }),
  ];

  return integrations;
}