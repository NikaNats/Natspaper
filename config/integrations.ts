/// <reference types="astro/client" />

import sitemap from "@astrojs/sitemap";
import Sonda from "sonda/astro";
import expressiveCode from "astro-expressive-code";
import { envValidationIntegration } from "../src/integrations/envValidation";
import { FEATURES } from "../src/config";

export function getIntegrations() {
  const integrations = [
    envValidationIntegration(),
    sitemap({
      // SEO: Filter configuration - exclude pages that shouldn't be indexed
      filter: page => {
        // Exclude archive pages if showArchives feature is disabled
        if (!FEATURES.showArchives && page.endsWith("/archives")) return false;

        // Exclude 404 error pages from sitemap
        if (page.includes("/404")) return false;

        return true;
      },

      // Internationalization support for multi-language sitemaps
      // Automatically generates alternate language links (hreflang)
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en-US",
          ka: "ka",
        },
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