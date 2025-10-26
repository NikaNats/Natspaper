import * as Sentry from "@sentry/astro";

// Initialize Sentry with DSN from environment variable
// Never hardcode secrets in source code - use .env.local instead
Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  sendDefaultPii: false, // Set to false in production to protect user privacy
  // Only enable if you've read and accepted the privacy implications
  // sendDefaultPii: true,
});
