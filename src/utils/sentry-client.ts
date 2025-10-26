import * as Sentry from "@sentry/astro";

/**
 * Global error handler script that captures client-side errors
 * This script should be loaded in the HTML head
 */

if (globalThis.window) {
  // Initialize Sentry if DSN is provided
  if (import.meta.env.PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.PUBLIC_SENTRY_DSN,
      environment: import.meta.env.MODE || "production",
      tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1,
    });
  }

  // Global error handler
  globalThis.window?.addEventListener("error", event => {
    if (import.meta.env.PUBLIC_SENTRY_DSN) {
      Sentry.captureException(event.error, {
        contexts: {
          browser: {
            url: globalThis.window?.location.href,
            userAgent: globalThis.navigator?.userAgent,
          },
        },
      });
    }
    // eslint-disable-next-line no-console
    console.error("Error:", event.error);
  });

  // Unhandled promise rejection handler
  globalThis.window?.addEventListener("unhandledrejection", event => {
    if (import.meta.env.PUBLIC_SENTRY_DSN) {
      Sentry.captureException(event.reason, {
        contexts: {
          browser: {
            url: globalThis.window?.location.href,
            userAgent: globalThis.navigator?.userAgent,
          },
        },
      });
    }
    // eslint-disable-next-line no-console
    console.error("Unhandled rejection:", event.reason);
  });
}
