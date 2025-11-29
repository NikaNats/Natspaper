/**
 * Analytics Module
 *
 * This module provides a unified interface for analytics tracking using Vercel Web Analytics.
 *
 * WHY VERCEL ANALYTICS ONLY (No Google Analytics):
 * ================================================
 * 1. GDPR/CCPA COMPLIANT BY DESIGN: Vercel Analytics doesn't use cookies or track personal data.
 *    - No consent banner required
 *    - No risk of privacy violations
 *    - Data is aggregated and anonymized
 *
 * 2. COST EFFICIENT: Uses your Vercel free tier (50k events/month)
 *    - No separate GA quota to manage
 *    - Built into your hosting platform
 *
 * 3. SIMPLER ARCHITECTURE: No need for consent management
 *    - Fewer moving parts
 *    - Less code to maintain
 *
 * For custom event tracking, use Vercel's track() function.
 * @see https://vercel.com/docs/analytics/custom-events
 *
 * Usage:
 * ```ts
 * import { trackEvent, trackPageView } from '@/utils/analytics';
 *
 * // Track custom events (uses Vercel custom events)
 * trackEvent('button_click', { button_id: 'subscribe' });
 *
 * // Track page views (automatic with Vercel Analytics)
 * trackPageView('/blog/my-post', 'My Post Title');
 * ```
 */

import { DEFAULT_LANG } from "@/i18n/config";

// Re-export types
export interface AnalyticsEvent {
  name: string;
  params: Record<string, string | number | boolean>;
}

/**
 * Track a custom event using Vercel Analytics
 *
 * Note: Vercel Analytics automatically tracks page views.
 * Use this for custom events like button clicks, form submissions, etc.
 *
 * @param eventName - Name of the event (max 50 chars for Vercel)
 * @param eventData - Additional event parameters (max 2 properties on free tier)
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, string | number | boolean>
): void {
  // Vercel Analytics custom events (if available)
  if (typeof globalThis !== "undefined" && globalThis.va) {
    try {
      // Vercel Analytics track function
      // @see https://vercel.com/docs/analytics/custom-events
      globalThis.va("event", {
        name: eventName,
        ...eventData,
      });
    } catch {
      // Silently fail - analytics should never break the app
    }
  }
}

/**
 * Track page view
 *
 * Note: Vercel Analytics automatically tracks page views, including client-side navigations.
 * This function is provided for explicit tracking when needed (e.g., virtual page views).
 *
 * @param pagePath - URL path of the page
 * @param pageTitle - Title of the page (optional)
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  // Vercel Analytics handles page views automatically
  // This function is a no-op but kept for API compatibility

  // For debugging in development
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug(
      `📊 Page view: ${pagePath}`,
      pageTitle ? `"${pageTitle}"` : ""
    );
  }
}

/**
 * Initialize analytics
 *
 * Note: Vercel Analytics initializes automatically via the @vercel/analytics component.
 * This function is kept for backward compatibility but is essentially a no-op.
 *
 * @param locale - Current page locale
 */
export function initializeAnalytics(locale: string = DEFAULT_LANG): void {
  // Vercel Analytics initializes automatically
  // This is a no-op for backward compatibility

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug(`📊 Analytics ready for locale: ${locale}`);
  }
}

/**
 * Track goal/conversion event
 *
 * @param goalName - Name of the goal/conversion
 * @param goalValue - Value of the conversion (default: 1)
 */
export function trackGoal(goalName: string, goalValue: number = 1): void {
  trackEvent("conversion", {
    conversion_name: goalName,
    conversion_value: goalValue,
  });
}

/**
 * Track blog post view
 *
 * @param postSlug - Unique identifier for the post
 * @param postTitle - Title of the post
 */
export function trackPostView(postSlug: string, postTitle: string): void {
  trackEvent("post_view", {
    post_id: postSlug,
    post_title: postTitle,
  });
}

/**
 * Track time on page
 *
 * @param pagePath - URL path of the page
 * @param timeSeconds - Time spent on page in seconds
 */
export function trackTimeOnPage(pagePath: string, timeSeconds: number): void {
  trackEvent("page_duration", {
    page_path: pagePath,
    duration_seconds: timeSeconds,
  });
}

/**
 * Track language switch
 *
 * @param fromLanguage - Language switched from
 * @param toLanguage - Language switched to
 */
export function trackLanguageSwitch(
  fromLanguage: string,
  toLanguage: string
): void {
  trackEvent("language_switch", {
    from_language: fromLanguage,
    to_language: toLanguage,
  });
}

/**
 * Track tag view
 *
 * @param tagName - Name of the tag
 */
export function trackTagView(tagName: string): void {
  trackEvent("tag_explored", {
    tag_name: tagName,
  });
}

/**
 * Set user language property
 *
 * Note: Vercel Analytics doesn't support persistent user properties.
 * This is kept for API compatibility but is a no-op.
 *
 * @param _locale - User's language preference
 */
export function setUserLanguageProperty(_locale: string): void {
  // Vercel Analytics doesn't have persistent user properties
  // Language is captured automatically via Accept-Language header
}

// Legacy service export for backward compatibility
export const analyticsService = {
  init: initializeAnalytics,
  trackPageView,
  trackEvent,
  trackGoal,
  trackPostView,
  trackTimeOnPage,
  trackLanguageSwitch,
  trackTagView,
};
