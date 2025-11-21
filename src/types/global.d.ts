// src/types/global.d.ts
export {};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer?: any[];

    // Vercel Analytics
    webAnalyticsBeforeSend?: (
      event: Record<string, unknown>
    ) => Record<string, unknown> | void;
    __VERCEL_ANALYTICS_INITIALIZED?: boolean;
    __VERCEL_ANALYTICS_LOADED?: boolean;
  }
}
