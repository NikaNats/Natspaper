import { googleAnalyticsProvider as provider } from "./google-analytics.provider";
import { DEFAULT_LANG } from "@/i18n/config";

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
 * import { analyticsService } from '@/utils/analytics';
 *
 * // Initialize on page load
 * analyticsService.init('en');
 *
 * // Track page views
 * analyticsService.trackPageView('/en/posts', 'Blog Posts');
 *
 * // Track custom events
 * analyticsService.trackEvent('search_performed', { search_query: 'tutorial' });
 *
 * // Track goals
 * analyticsService.trackGoal('subscribe_to_rss', 1);
 * ```
 */

class AnalyticsService {
  private locale: string = DEFAULT_LANG;

  /**
   * Initialize Google Analytics with language tracking
   * Call this from your main layout after page load
   *
   * @param locale - Current page locale (e.g., 'en', 'ka')
   */
  public init(locale: string = DEFAULT_LANG): void {
    this.locale = locale;
    provider.init(locale);
    this.setUserLanguageProperty(locale);
  }

  /**
   * Track page view with language information
   *
   * @param pagePath - URL path of the page
   * @param pageTitle - Title of the page
   */
  public trackPageView(pagePath: string, pageTitle: string): void {
    const siteSection = this.getSiteSection(pagePath);

    provider.track({
      name: "page_view",
      params: {
        page_path: pagePath,
        page_title: pageTitle,
        language: this.locale,
        site_section: siteSection,
      },
    });
  }

  /**
   * Track custom events with language context
   *
   * @param eventName - Name of the event
   * @param eventData - Additional event parameters
   */
  public trackEvent(
    eventName: string,
    eventData?: Record<string, string | number | boolean>
  ): void {
    provider.track({
      name: eventName,
      params: {
        language: this.locale,
        event_category: "engagement",
        ...eventData,
      },
    });
  }

  /**
   * Track goal/conversion event
   *
   * @param goalName - Name of the goal/conversion
   * @param goalValue - Value of the conversion (default: 1)
   */
  public trackGoal(goalName: string, goalValue: number = 1): void {
    provider.track({
      name: "conversion",
      params: {
        conversion_name: goalName,
        conversion_value: goalValue,
        language: this.locale,
        conversion_currency: "USD",
      },
    });
  }

  /**
   * Track blog post view with language and post info
   *
   * @param postSlug - Unique identifier for the post
   * @param postTitle - Title of the post
   */
  public trackPostView(postSlug: string, postTitle: string): void {
    provider.track({
      name: "post_view",
      params: {
        post_id: postSlug,
        post_title: postTitle,
        language: this.locale,
        content_type: "blog_post",
      },
    });
  }

  /**
   * Track time on page (call when user leaves page or after timeout)
   *
   * @param pagePath - URL path of the page
   * @param timeSeconds - Time spent on page in seconds
   */
  public trackTimeOnPage(pagePath: string, timeSeconds: number): void {
    provider.track({
      name: "page_duration",
      params: {
        page_path: pagePath,
        duration_seconds: timeSeconds,
        language: this.locale,
      },
    });
  }

  /**
   * Track language switch event
   *
   * @param fromLanguage - Language switched from
   * @param toLanguage - Language switched to
   */
  public trackLanguageSwitch(fromLanguage: string, toLanguage: string): void {
    provider.track({
      name: "language_switch",
      params: {
        from_language: fromLanguage,
        to_language: toLanguage,
        event_category: "user_engagement",
      },
    });
  }

  /**
   * Track search event
   *
   * @param searchQuery - Search query string
   * @param resultCount - Number of search results (optional)
   */
  public trackSearch(searchQuery: string, resultCount?: number): void {
    provider.track({
      name: "search",
      params: {
        search_term: searchQuery,
        language: this.locale,
        ...(resultCount !== undefined && { result_count: resultCount }),
      },
    });
  }

  /**
   * Track tag exploration
   *
   * @param tagName - Name of the tag
   */
  public trackTagView(tagName: string): void {
    provider.track({
      name: "tag_explored",
      params: {
        tag_name: tagName,
        language: this.locale,
        tag_type: "blog_tag",
      },
    });
  }

  /**
   * Set user properties that persist across sessions
   *
   * @param locale - User's language preference
   */
  private setUserLanguageProperty(locale: string): void {
    provider.setUserProperty({
      user_locale: locale,
      user_language_preference: locale,
    });
  }

  /**
   * Determine site section from URL path
   * @internal
   */
  private getSiteSection(pagePath: string): string {
    // Remove locale prefix for matching
    const pathWithoutLocale = pagePath.replace(
      new RegExp(`^/${this.locale}`),
      ""
    );

    if (pathWithoutLocale.includes("/posts/")) return "blog";
    if (pathWithoutLocale.includes("/tags/")) return "tags";
    if (pathWithoutLocale.includes("/archives/")) return "archives";
    if (pathWithoutLocale.includes("/search/")) return "search";
    return "home";
  }
}

// Export a single, singleton instance of the service
export const analyticsService = new AnalyticsService();

// Legacy exports for backward compatibility
export const initializeAnalytics = (locale: string) =>
  analyticsService.init(locale);
export const trackPageView = (pagePath: string, pageTitle: string) =>
  analyticsService.trackPageView(pagePath, pageTitle);
export const trackEvent = (
  eventName: string,
  eventData?: Record<string, string | number | boolean>
) => analyticsService.trackEvent(eventName, eventData);
export const trackGoal = (goalName: string, goalValue?: number) =>
  analyticsService.trackGoal(goalName, goalValue);
export const trackPostView = (postSlug: string, postTitle: string) =>
  analyticsService.trackPostView(postSlug, postTitle);
export const trackTimeOnPage = (pagePath: string, timeSeconds: number) =>
  analyticsService.trackTimeOnPage(pagePath, timeSeconds);
export const trackLanguageSwitch = (fromLanguage: string, toLanguage: string) =>
  analyticsService.trackLanguageSwitch(fromLanguage, toLanguage);
export const trackSearch = (searchQuery: string, resultCount?: number) =>
  analyticsService.trackSearch(searchQuery, resultCount);
export const trackTagView = (tagName: string) =>
  analyticsService.trackTagView(tagName);
export const setUserLanguageProperty = (locale: string) =>
  analyticsService["setUserLanguageProperty"](locale);

// Type exports
export type { AnalyticsEvent } from "./provider";
export { ANALYTICS_CONFIG } from "./google-analytics.provider";

// Type definitions are now in src/types/global.d.ts
// This prevents duplicate declarations and ensures single source of truth
