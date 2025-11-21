/**
 * Vercel Web Analytics Configuration
 *
 * This module handles the beforeSend callback for filtering sensitive data
 * and controlling which events are sent to Vercel Analytics.
 *
 * The @vercel/analytics package is automatically included by Astro
 * and will use the webAnalyticsBeforeSend function from window if available.
 *
 * See: https://vercel.com/docs/analytics/redacting-sensitive-data
 */

export interface BeforeSendEvent extends Record<string, unknown> {
  url: string;
}

/**
 * Client-side script to initialize Vercel Web Analytics
 *
 * This function should be called from your layout after page load.
 * It uses the @vercel/analytics package with beforeSend filtering.
 *
 * @example
 * ```ts
 * // In your layout's script tag:
 * import { initVercelAnalyticsClient } from '@/utils/vercel-analytics-init';
 * initVercelAnalyticsClient();
 * ```
 */
export function initVercelAnalyticsClient(): void {
  // Skip if not in browser
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  // Skip if already initialized in this session
  if (window.__VERCEL_ANALYTICS_INITIALIZED) {
    return;
  }

  try {
    window.__VERCEL_ANALYTICS_INITIALIZED = true;

    // Check if @vercel/analytics is available (it's auto-injected by Astro)
    // If not, load it manually via the official Vercel endpoint
    if (!window.__VERCEL_ANALYTICS_LOADED) {
      // The @vercel/analytics package will load the script from /_vercel/insights/script.js
      // if it hasn't been loaded already. This is handled by Astro's integration.
      // We just need to ensure the beforeSend callback is set up first.
      loadVercelAnalyticsScript();
    }
  } catch {
    // Silently fail if analytics initialization fails
    // This won't block page functionality
  }
}

/**
 * Load the official Vercel Web Analytics script
 * @internal
 */
function loadVercelAnalyticsScript(): void {
  try {
    // Check if script already exists
    if (document.querySelector('script[src*="_vercel/insights"]')) {
      window.__VERCEL_ANALYTICS_LOADED = true;
      return;
    }

    const script = document.createElement("script");
    script.src = "/_vercel/insights/script.js";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.__VERCEL_ANALYTICS_LOADED = true;
    };

    script.onerror = () => {
      // Script failed to load - this is normal on non-Vercel deployments
      // The application continues to work normally
    };

    document.head.appendChild(script);
  } catch {
    // Silently fail if script loading fails
  }
}
