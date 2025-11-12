import sitemap from "@astrojs/sitemap";
import sentry from "@sentry/astro";
import Sonda from "sonda/astro";
import expressiveCode from "astro-expressive-code";
import { envValidationIntegration } from "../src/integrations/envValidation";
import { SITE } from "../src/config";

export function getIntegrations() {
  const integrations = [
    envValidationIntegration(),
    sitemap({
      // Filter configuration - excludes archive pages if showArchives is false
      filter: page => SITE.showArchives || !page.endsWith("/archives"),

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
    sentry({
      // Configuration for source map uploads during build
      // Enables readable stack traces in production by uploading source maps
      sourceMapsUploadOptions: {
        project: "natspaper",
        org: "nika-1u",
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },

      // Auto instrumentation for request handling (Astro 3.5.2+)
      // Automatically adds middleware for request tracking and distributed tracing
      autoInstrumentation: {
        requestHandler: true,
      },
    }),
    expressiveCode(),
    Sonda({
      format: ["html", "json"],
    }),
  ];

  return integrations;
}