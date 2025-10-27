/**
 * Client-side Sentry initialization utility
 * Provides both immediate and deferred initialization strategies
 */

import * as Sentry from "@sentry/astro";

interface SentryClientConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

/**
 * Get Sentry configuration from environment variables
 */
function getSentryConfig(): SentryClientConfig {
  const environment = (import.meta.env.PUBLIC_SENTRY_ENVIRONMENT ||
    import.meta.env.MODE ||
    "production") as string;
  const isProduction = environment === "production";

  const tracesSampleRate = parseFloat(
    import.meta.env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE ||
      (isProduction ? "0.1" : "1")
  );

  const replaysSessionSampleRate = parseFloat(
    import.meta.env.PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || "0.1"
  );

  const replaysOnErrorSampleRate = parseFloat(
    import.meta.env.PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || "1"
  );

  return {
    dsn: import.meta.env.PUBLIC_SENTRY_DSN || "",
    environment,
    tracesSampleRate,
    replaysSessionSampleRate,
    replaysOnErrorSampleRate,
  };
}

/**
 * Attach global error event listener
 */
function attachErrorHandler(): void {
  if (!globalThis.window) {
    return;
  }

  globalThis.window.addEventListener("error", (event: ErrorEvent) => {
    Sentry.captureException(event.error, {
      level: "error",
      tags: { handler: "window.error" },
      contexts: {
        browser: {
          url: globalThis.window?.location.href,
          userAgent: globalThis.navigator?.userAgent,
        },
      },
    });

    // eslint-disable-next-line no-console
    console.error("[Sentry] Error:", event.error);
  });
}

/**
 * Attach unhandled promise rejection event listener
 */
function attachUnhandledRejectionHandler(): void {
  if (!globalThis.window) {
    return;
  }

  globalThis.window.addEventListener(
    "unhandledrejection",
    (event: PromiseRejectionEvent) => {
      Sentry.captureException(event.reason, {
        level: "error",
        tags: { handler: "window.unhandledrejection" },
        contexts: {
          browser: {
            url: globalThis.window?.location.href,
            userAgent: globalThis.navigator?.userAgent,
          },
        },
      });

      // eslint-disable-next-line no-console
      console.error("[Sentry] Unhandled rejection:", event.reason);
    }
  );
}

/**
 * Initialize Sentry immediately (blocks rendering)
 * Use this when error tracking must be active before page content renders
 */
export function init(): void {
  if (!globalThis.window) {
    return;
  }

  const config = getSentryConfig();

  if (!config.dsn) {
    // eslint-disable-next-line no-console
    console.debug("[Sentry] DSN not configured");
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    tracesSampleRate: config.tracesSampleRate,
    replaysSessionSampleRate: config.replaysSessionSampleRate,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
    attachStacktrace: true,
    beforeSend(event) {
      const exception = event.exception?.values?.[0];
      if (exception?.value?.includes("top.GLOBALS")) {
        return null;
      }
      return event;
    },
  });

  attachErrorHandler();
  attachUnhandledRejectionHandler();

  // eslint-disable-next-line no-console
  console.debug(`[Sentry] Initialized in ${config.environment}`);
}

/**
 * Initialize Sentry after page load (recommended)
 * This prevents blocking the critical rendering path
 */
export function initDeferred(): void {
  if (!globalThis.window) {
    return;
  }

  const config = getSentryConfig();

  if (!config.dsn) {
    // eslint-disable-next-line no-console
    console.debug("[Sentry] DSN not configured");
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    tracesSampleRate: config.tracesSampleRate,
    replaysSessionSampleRate: config.replaysSessionSampleRate,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
    attachStacktrace: true,
    beforeSend(event) {
      const exception = event.exception?.values?.[0];
      if (exception?.value?.includes("top.GLOBALS")) {
        return null;
      }
      return event;
    },
  });

  attachErrorHandler();
  attachUnhandledRejectionHandler();

  // eslint-disable-next-line no-console
  console.debug(`[Sentry] Initialized in ${config.environment}`);
}

/**
 * Manually capture an exception
 */
export function captureException(
  error: unknown,
  options?: Record<string, unknown>
): void {
  Sentry.captureException(error, options);
}

/**
 * Manually capture a message
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info"
): void {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(userData: Record<string, unknown> | null): void {
  if (userData) {
    Sentry.setUser(userData);
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add a breadcrumb to error context
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  category: string = "custom",
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info"
): void {
  Sentry.addBreadcrumb({
    message,
    data,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
}
