// src/types/global.d.ts
export {};

/**
 * Google Analytics gtag argument type
 * gtag can accept command (string), command ID (string), date objects, and config objects
 */
type GtagArgument = string | number | boolean | Date | Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: GtagArgument[]) => void;
    dataLayer?: Array<GtagArgument[]>;

    // Vercel Analytics
    webAnalyticsBeforeSend?: (
      event: Record<string, unknown> & { url: string }
    ) => Record<string, unknown> | void;
    __VERCEL_ANALYTICS_INITIALIZED?: boolean;
    __VERCEL_ANALYTICS_LOADED?: boolean;
  }
}
