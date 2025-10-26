import * as Sentry from "@sentry/astro";

// Initialize Sentry with DSN from environment variable
// Never hardcode secrets in source code - use .env.local instead
// Server-side DSN should be different from client-side for better security
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.PUBLIC_SENTRY_DSN,
  sendDefaultPii: false, // Set to false in production to protect user privacy
  // Only enable if you've read and accepted the privacy implications
  // sendDefaultPii: true,
});
