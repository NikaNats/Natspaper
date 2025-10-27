/**
 * Unified Sentry Configuration
 *
 * Single source of truth for all Sentry setup.
 * Used by both client and server initialization.
 */

import { getEnv } from "@/env";

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
 * Get Sentry configuration for the given context
 *
 * @param context - "client" for browser, "server" for Node.js
 * @returns SentryConfig object ready to pass to Sentry.init()
 */
export function getSentryConfig(context: "client" | "server"): SentryConfig {
  const isDev = process.env.NODE_ENV === "development";

  // Determine DSN based on context
  let dsn: string | undefined;

  if (context === "client") {
    // Client uses public DSN (safe to expose)
    dsn = getEnv("PUBLIC_SENTRY_DSN");
  } else {
    // Server can use private DSN first, fallback to public
    dsn = getEnv("SENTRY_DSN") ?? getEnv("PUBLIC_SENTRY_DSN");
  }

  // Determine environment label
  const environment =
    getEnv("PUBLIC_SENTRY_ENVIRONMENT") ||
    (isDev ? "development" : "production");

  // Parse sampling rates
  const tracesSampleRate = parseFloat(
    getEnv("PUBLIC_SENTRY_TRACES_SAMPLE_RATE") || (isDev ? "1" : "0.1")
  );

  const replaysSessionSampleRate = parseFloat(
    getEnv("PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE") || "0.1"
  );

  const replaysOnErrorSampleRate = parseFloat(
    getEnv("PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE") || "1"
  );

  return {
    enabled: Boolean(dsn),
    dsn: dsn || "",
    environment,
    tracesSampleRate,
    replaysSessionSampleRate,
    replaysOnErrorSampleRate,
  };
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
