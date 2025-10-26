import * as Sentry from "@sentry/astro";

/**
 * Server-side Sentry Configuration
 * 
 * Initialize Sentry for server-side error tracking if DSN is provided
 * 
 * Environment variables:
 * - SENTRY_DSN: Server-side Sentry DSN (required for error tracking)
 * - SENTRY_ENVIRONMENT: Environment name (development, staging, production)
 * - SENTRY_TRACE_SAMPLE_RATE: Server-side tracing sample rate (0.0-1.0)
 * 
 * @see https://docs.sentry.io/platforms/javascript/guides/astro/
 */

const sentryDsn = process.env.SENTRY_DSN;
const environment = process.env.NODE_ENV || "production";

const getTraceSampleRate = (): number => {
  if (process.env.SENTRY_TRACE_SAMPLE_RATE) {
    return Number.parseFloat(process.env.SENTRY_TRACE_SAMPLE_RATE);
  }
  if (environment === "production") {
    return 0.1;
  }
  return 1;
};

const traceSampleRate = getTraceSampleRate();

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment,
    tracesSampleRate: traceSampleRate,
    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
    // Attach stack traces to all messages
    attachStacktrace: true,
  });
}
