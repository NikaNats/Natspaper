/**
 * Unified Sentry Configuration
 *
 * Single source of truth for all Sentry setup.
 * Used by both client and server initialization.
 */

import { buildSentryConfig } from "./sentry.builder";

/**
 * Sentry configuration object
 */
export interface SentryConfig {
  enabled: boolean;
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

/**
 * REFACTORED: This function is now just a simple wrapper around the builder.
 * All the complex, hard-coded logic is gone.
 */
export function getSentryConfig(context: "client" | "server"): SentryConfig {
  return buildSentryConfig(context);
}

/**
 * Initialize Sentry in client context
 */
export function getClientSentryInit() {
  const config = getSentryConfig("client");

  if (!config.enabled) {
    return null;
  }

  return {
    ...config,
    attachStacktrace: true,
    beforeSend(event: Record<string, unknown>) {
      // Filter out known browser noise
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exception = (event.exception as any)?.values?.[0];
      if ((exception?.value as string)?.includes("top.GLOBALS")) {
        return null;
      }
      return event;
    },
  };
}

/**
 * Initialize Sentry in server context
 */
export function getServerSentryInit() {
  const config = getSentryConfig("server");

  if (!config.enabled) {
    return null;
  }

  return {
    ...config,
    attachStacktrace: true,
  };
}
