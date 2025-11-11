import type { AnalyticsProvider, AnalyticsEvent } from "./provider";

/* eslint-disable no-console */

export const ANALYTICS_CONFIG = {
  MEASUREMENT_ID: import.meta.env.PUBLIC_GA_MEASUREMENT_ID,
  ENABLE_DEBUG: import.meta.env.PUBLIC_GA_DEBUG === "true",
} as const;

class GoogleAnalyticsProvider implements AnalyticsProvider {
  private isInitialized = false;

  public init(locale: string): void {
    if (this.isInitialized || !ANALYTICS_CONFIG.MEASUREMENT_ID) {
      if (ANALYTICS_CONFIG.ENABLE_DEBUG && !ANALYTICS_CONFIG.MEASUREMENT_ID) {
        console.warn("⚠️ GA Measurement ID not configured");
      }
      return;
    }

    try {
      this.loadGtagScript();

      window.gtag?.("config", ANALYTICS_CONFIG.MEASUREMENT_ID, {
        page_path: window.location.pathname,
        custom_language: locale,
        debug_mode: ANALYTICS_CONFIG.ENABLE_DEBUG,
      });

      this.isInitialized = true;

      if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
        console.log(`✅ Analytics initialized for locale: ${locale}`);
      }
    } catch (error) {
      console.error("❌ Failed to initialize analytics:", error);
    }
  }

  public track(event: AnalyticsEvent): void {
    if (!this.isInitialized) {
      if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
        console.warn("⚠️ gtag not available");
      }
      return;
    }

    try {
      window.gtag?.("event", event.name, event.params);

      if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
        console.log(`📊 Event tracked: ${event.name}`, event.params);
      }
    } catch (error) {
      console.error("❌ Failed to track event:", error);
    }
  }

  public setUserProperty(
    properties: Record<string, string | number | boolean>
  ): void {
    if (!this.isInitialized) {
      if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
        console.warn("⚠️ gtag not available");
      }
      return;
    }

    try {
      window.gtag?.("set", properties);

      if (ANALYTICS_CONFIG.ENABLE_DEBUG) {
        console.log(`👤 User properties set:`, properties);
      }
    } catch (error) {
      console.error("❌ Failed to set user properties:", error);
    }
  }

  /**
   * Load gtag script if not already loaded
   * @internal
   */
  private loadGtagScript(): void {
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
}

export const googleAnalyticsProvider = new GoogleAnalyticsProvider();
