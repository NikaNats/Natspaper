/**
 * ⚠️ LEGACY - Used by Astro/Sentry integration but overridden by consolidated utility
 *
 * This file is kept for reference and is processed by the Astro/Sentry integration.
 * However, client-side initialization is now primarily handled by src/utils/sentry-client-init.ts
 * which is called from src/layouts/Layout.astro.
 *
 * INITIALIZATION FLOW:
 * ═══════════════════════════════════════════════════════════════
 * 1. Astro processes sentry.client.config.ts during build
 * 2. At runtime, src/layouts/Layout.astro calls initDeferred() from sentry-client-init.ts
 * 3. Error tracking is initialized after page load
 *
 * WHEN TO MODIFY THIS FILE:
 * - If you need to change how Astro's Sentry integration works during build time
 * - For documentation purposes only; most Sentry configuration is in sentry-client-init.ts
 *
 * For new Sentry configuration changes:
 * → Edit src/utils/sentry-client-init.ts instead
 *
 * See src/utils/sentry-client-init.ts for the main implementation.
 * See docs/SENTRY_SETUP.md for the complete setup guide.
 */

import * as Sentry from "@sentry/astro";

// Initialize Sentry with DSN from environment variable
// Never hardcode secrets in source code - use .env.local instead
Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  sendDefaultPii: false, // Set to false in production to protect user privacy
  // Only enable if you've read and accepted the privacy implications
  // sendDefaultPii: true,
});
