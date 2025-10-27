/**
 * Client-side Sentry initialization utility
 * Provides both immediate and deferred initialization strategies
 *
 * Updated to use unified Sentry configuration from src/utils/sentry/config.ts
 */

import * as Sentry from "@sentry/astro";
import { getSentryConfig, getClientSentryInit } from "./sentry/config";

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
        tags: { handler: "unhandledrejection" },
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

  const config = getSentryConfig("client");
  if (!config.enabled) {
    // eslint-disable-next-line no-console
    console.debug("[Sentry] Not configured (DSN missing)");
    return;
  }

  const sentryInit = getClientSentryInit();
  if (!sentryInit) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Sentry.init(sentryInit as any);
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

  const config = getSentryConfig("client");
  if (!config.enabled) {
    // eslint-disable-next-line no-console
    console.debug("[Sentry] Not configured (DSN missing)");
    return;
  }

  const sentryInit = getClientSentryInit();
  if (!sentryInit) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Sentry.init(sentryInit as any);
  attachErrorHandler();
  attachUnhandledRejectionHandler();

  // eslint-disable-next-line no-console
  console.debug(`[Sentry] Initialized (deferred) in ${config.environment}`);
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
