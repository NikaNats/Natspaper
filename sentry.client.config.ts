import * as Sentry from "@sentry/astro";

// Initialize Sentry for client-side error tracking
Sentry.init({
  dsn: "https://03da85f0ddf12cf684ac0999638806b5@o4510255602663424.ingest.de.sentry.io/4510255653781584",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

export * from "@sentry/astro";
