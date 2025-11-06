/**
 * Analytics Configuration and Helpers
 * Supports language-aware tracking for multilingual sites
 *
 * Features:
 * - Google Analytics 4 integration
 * - Language-specific event tracking
 * - Custom dimensions for language and site section
 * - Goal/conversion tracking
 * - Time on page tracking
 * - Debug mode support
 *
 * Usage:
 * ```ts
 * import { initializeAnalytics, trackPageView, trackEvent } from '@/utils/analytics';
 *
 * // Initialize on page load
 * initializeAnalytics('en');
 *
 * // Track page views
 * trackPageView('/en/posts', 'Blog Posts', 'en');
 *
 * // Track custom events
 * trackEvent('search_performed', 'en', { search_query: 'tutorial' });
 *
 * // Track goals
 * trackGoal('subscribe_to_rss', 1, 'en');
 * ```
 */

/* eslint-disable no-console */

export const ANALYTICS_CONFIG = {
  MEASUREMENT_ID: import.meta.env.PUBLIC_GA_MEASUREMENT_ID,
  ENABLE_DEBUG: import.meta.env.PUBLIC_GA_DEBUG === "true",
} as const;

/**
 * Type definitions for analytics events
 */
export interface AnalyticsEvent {
  event_name: string;
  language: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Initialize Google Analytics with language tracking
 * Call this from your main layout after page load
 *
 * @param locale - Current page locale (e.g., 'en', 'ka')
 * @returns void
 *
 * @example
 * ```ts
 * initializeAnalytics('en');
 * ```
 */
export function initializeAnalytics(locale: string = "en"): void {
  if (!ANALYTICS_CONFIG.MEASUREMENT_ID) {
    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.warn("⚠️ GA Measurement ID not configured");
    }
    return;
  }

  try {
    // Load gtag script
    loadGtagScript();

    // Set page-level configuration with language tracking
    window.gtag?.("config", ANALYTICS_CONFIG.MEASUREMENT_ID, {
      page_path: window.location.pathname,
      custom_language: locale,
      debug_mode: ANALYTICS_CONFIG.ENABLE_DEBUG,
    });

    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.log(`✅ Analytics initialized for locale: ${locale}`);
    }
  } catch (error) {
    console.error("❌ Failed to initialize analytics:", error);
  }
}

/**
 * Track page view with language information
 *
 * @param pagePath - URL path of the page
 * @param pageTitle - Title of the page
 * @param locale - Language locale (default: 'en')
 * @returns void
 *
 * @example
 * ```ts
 * trackPageView('/en/posts', 'Blog Posts', 'en');
 * ```
 */
export function trackPageView(
  pagePath: string,
  pageTitle: string,
  locale: string = "en"
): void {
  if (!window.gtag) {
    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.warn("⚠️ gtag not available");
    }
    return;
  }

  try {
    const siteSection = getSiteSection(pagePath, locale);

    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_title: pageTitle,
      language: locale,
      site_section: siteSection,
    });

    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.log(`📊 Page view tracked: ${pageTitle} (${locale})`);
    }
  } catch (error) {
    console.error("❌ Failed to track page view:", error);
  }
}

/**
 * Track custom events with language context
 *
 * @param eventName - Name of the event
 * @param locale - Language locale (default: 'en')
 * @param eventData - Additional event parameters
 * @returns void
 *
 * @example
 * ```ts
 * trackEvent('search_performed', 'en', { search_query: 'tutorial' });
 * ```
 */
export function trackEvent(
  eventName: string,
  locale: string = "en",
  eventData?: Record<string, string | number | boolean>
): void {
  if (!window.gtag) {
    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.warn("⚠️ gtag not available");
    }
    return;
  }

  try {
    window.gtag("event", eventName, {
      language: locale,
      event_category: "engagement",
      ...eventData,
    });

    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.log(`📊 Event tracked: ${eventName}`, eventData);
    }
  } catch (error) {
    console.error("❌ Failed to track event:", error);
  }
}

/**
 * Track goal/conversion event
 *
 * @param goalName - Name of the goal/conversion
 * @param goalValue - Value of the conversion (default: 1)
 * @param locale - Language locale (default: 'en')
 * @returns void
 *
 * @example
 * ```ts
 * trackGoal('subscribe_to_rss', 1, 'en');
 * ```
 */
export function trackGoal(
  goalName: string,
  goalValue: number = 1,
  locale: string = "en"
): void {
  if (!window.gtag) {
    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.warn("⚠️ gtag not available");
    }
    return;
  }

  try {
    window.gtag("event", "conversion", {
      conversion_name: goalName,
      conversion_value: goalValue,
      language: locale,
      conversion_currency: "USD",
    });

    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.log(`🎯 Goal tracked: ${goalName} (value: ${goalValue})`);
    }
  } catch (error) {
    console.error("❌ Failed to track goal:", error);
  }
}

/**
 * Track blog post view with language and post info
 *
 * @param postSlug - Unique identifier for the post
 * @param postTitle - Title of the post
 * @param locale - Language locale (default: 'en')
 * @returns void
 *
 * @example
 * ```ts
 * trackPostView('how-to-setup-astro', 'How to Setup Astro', 'en');
 * ```
 */
export function trackPostView(
  postSlug: string,
  postTitle: string,
  locale: string = "en"
): void {
  if (!window.gtag) {
    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.warn("⚠️ gtag not available");
    }
    return;
  }

  try {
    window.gtag("event", "post_view", {
      post_id: postSlug,
      post_title: postTitle,
      language: locale,
      content_type: "blog_post",
    });

    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.log(`📝 Post view tracked: ${postTitle} (${locale})`);
    }
  } catch (error) {
    console.error("❌ Failed to track post view:", error);
  }
}

/**
 * Track time on page (call when user leaves page or after timeout)
 *
 * @param pagePath - URL path of the page
 * @param timeSeconds - Time spent on page in seconds
 * @param locale - Language locale (default: 'en')
 * @returns void
 *
 * @example
 * ```ts
 * trackTimeOnPage('/en/posts/my-post', 120, 'en');
 * ```
 */
export function trackTimeOnPage(
  pagePath: string,
  timeSeconds: number,
  locale: string = "en"
): void {
  if (!window.gtag) {
    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.warn("⚠️ gtag not available");
    }
    return;
  }

  try {
    window.gtag("event", "page_duration", {
      page_path: pagePath,
      duration_seconds: timeSeconds,
      language: locale,
    });

    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.log(`⏱️ Time on page tracked: ${timeSeconds}s (${pagePath})`);
    }
  } catch (error) {
    console.error("❌ Failed to track time on page:", error);
  }
}

/**
 * Track language switch event
 *
 * @param fromLanguage - Language switched from
 * @param toLanguage - Language switched to
 * @returns void
 *
 * @example
 * ```ts
 * trackLanguageSwitch('en', 'ka');
 * ```
 */
export function trackLanguageSwitch(
  fromLanguage: string,
  toLanguage: string
): void {
  if (!window.gtag) {
    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.warn("⚠️ gtag not available");
    }
    return;
  }

  try {
    window.gtag("event", "language_switch", {
      from_language: fromLanguage,
      to_language: toLanguage,
      event_category: "user_engagement",
    });

    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.log(
        `🌐 Language switch tracked: ${fromLanguage} → ${toLanguage}`
      );
    }
  } catch (error) {
    console.error("❌ Failed to track language switch:", error);
  }
}

/**
 * Track search event
 *
 * @param searchQuery - Search query string
 * @param locale - Language locale (default: 'en')
 * @param resultCount - Number of search results (optional)
 * @returns void
 *
 * @example
 * ```ts
 * trackSearch('astro tutorial', 'en', 5);
 * ```
 */
export function trackSearch(
  searchQuery: string,
  locale: string = "en",
  resultCount?: number
): void {
  if (!window.gtag) {
    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.warn("⚠️ gtag not available");
    }
    return;
  }

  try {
    window.gtag("event", "search", {
      search_term: searchQuery,
      language: locale,
      ...(resultCount !== undefined && { result_count: resultCount }),
    });

    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.log(`🔍 Search tracked: "${searchQuery}" (${locale})`);
    }
  } catch (error) {
    console.error("❌ Failed to track search:", error);
  }
}

/**
 * Track tag exploration
 *
 * @param tagName - Name of the tag
 * @param locale - Language locale (default: 'en')
 * @returns void
 *
 * @example
 * ```ts
 * trackTagView('astro', 'en');
 * ```
 */
export function trackTagView(tagName: string, locale: string = "en"): void {
  if (!window.gtag) {
    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.warn("⚠️ gtag not available");
    }
    return;
  }

  try {
    window.gtag("event", "tag_explored", {
      tag_name: tagName,
      language: locale,
      tag_type: "blog_tag",
    });

    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.log(`🏷️ Tag view tracked: #${tagName} (${locale})`);
    }
  } catch (error) {
    console.error("❌ Failed to track tag view:", error);
  }
}

/**
 * Set user properties that persist across sessions
 *
 * @param locale - User's language preference
 * @returns void
 *
 * @example
 * ```ts
 * setUserLanguageProperty('en');
 * ```
 */
export function setUserLanguageProperty(locale: string): void {
  if (!window.gtag) {
    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.warn("⚠️ gtag not available");
    }
    return;
  }

  try {
    window.gtag("set", {
      user_locale: locale,
      user_language_preference: locale,
    });

    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.log(`👤 User language property set: ${locale}`);
    }
  } catch (error) {
    console.error("❌ Failed to set user language property:", error);
  }
}

/**
 * Load gtag script if not already loaded
 * @internal
 */
function loadGtagScript(): void {
  if (window.gtag) return; // Already loaded

  try {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.MEASUREMENT_ID}`;

    script.onerror = () => {
      console.error("❌ Failed to load Google Analytics script");
    };

    document.head.appendChild(script);

    // Initialize dataLayer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).dataLayer = (window as any).dataLayer || [];

    // Initialize gtag function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gtag = function gtag(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...gtagArgs: any[]
    ): void {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).dataLayer.push(gtagArgs);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gtag("js", new Date());

    if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
      console.log("✅ Google Analytics script loaded");
    }
  } catch (error) {
    console.error("❌ Failed to initialize gtag script:", error);
  }
}

/**
 * Determine site section from URL path
 * @internal
 */
function getSiteSection(pagePath: string, locale: string): string {
  // Remove locale prefix for matching
  const pathWithoutLocale = pagePath.replace(new RegExp(`^/${locale}`), "");

  if (pathWithoutLocale.includes("/posts/")) return "blog";
  if (pathWithoutLocale.includes("/tags/")) return "tags";
  if (pathWithoutLocale.includes("/archives/")) return "archives";
  if (pathWithoutLocale.includes("/search/")) return "search";
  return "home";
}

/**
 * TypeScript type definitions for window.gtag
 */
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer?: any[];
  }
}

// Export config for debugging
export const getAnalyticsConfig = () => ANALYTICS_CONFIG;
