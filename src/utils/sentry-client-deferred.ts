/**
 * Deferred Sentry Client Initialization
 * Initializes Sentry error tracking only after the page has fully rendered
 * This prevents blocking the critical rendering path
 *
 * Usage:
 * Call this function in a script tag with defer attribute or after page load
 * Example: window.addEventListener('load', initDeferredSentry);
 */

import * as Sentry from "@sentry/astro";

/**
 * Initialize Sentry after page has fully rendered
 * Allows page to render content before error tracking is initialized
 * Reduces time to first meaningful paint
 */
export function initDeferredSentry(): void {
  if (!globalThis.window) {
    return;
  }

  // Only initialize if DSN is configured
  if (!import.meta.env.PUBLIC_SENTRY_DSN) {
    return;
  }

  // Initialize Sentry
  Sentry.init({
    dsn: import.meta.env.PUBLIC_SENTRY_DSN,
    environment: import.meta.env.MODE || "production",
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
  });

  // Global error handler for uncaught exceptions
  globalThis.window.addEventListener("error", (event) => {
    Sentry.captureException(event.error, {
      contexts: {
        browser: {
          url: globalThis.window?.location.href,
          userAgent: globalThis.navigator?.userAgent,
        },
      },
    });
    // eslint-disable-next-line no-console
    console.error("Error:", event.error);
  });

  // Global handler for unhandled promise rejections
  globalThis.window.addEventListener("unhandledrejection", (event) => {
    Sentry.captureException(event.reason, {
      contexts: {
        browser: {
          url: globalThis.window?.location.href,
          userAgent: globalThis.navigator?.userAgent,
        },
      },
    });
    // eslint-disable-next-line no-console
    console.error("Unhandled rejection:", event.reason);
  });
}
