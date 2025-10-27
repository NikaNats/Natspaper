/**
 * ⚠️ DEPRECATED - This file has been consolidated
 *
 * This file is DEPRECATED and should not be used in new code.
 * All functionality has been moved to src/utils/sentry-client-init.ts
 *
 * MIGRATION GUIDE:
 * ═══════════════════════════════════════════════════════════════
 * OLD:
 *   import { initDeferredSentry } from "@/utils/sentry-client-deferred";
 *   initDeferredSentry();
 *
 * NEW:
 *   import { initDeferred } from "@/utils/sentry-client-init";
 *   initDeferred();
 *
 * REASON FOR CONSOLIDATION:
 * - Unified client-side Sentry initialization in one location
 * - Clear distinction between immediate and deferred initialization strategies
 * - Improved maintainability and discoverability
 * - Additional utility functions: captureException, captureMessage, setUser, addBreadcrumb
 *
 * See src/utils/sentry-client-init.ts for the new implementation.
 * See docs/SENTRY_SETUP.md for the complete setup guide.
 */

// @deprecated Use src/utils/sentry-client-init.ts instead
export { initDeferred as initDeferredSentry } from "./sentry-client-init";
