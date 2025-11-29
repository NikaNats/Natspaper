// src/types/global.d.ts
export {};

declare global {
  interface Window {
    // Vercel Analytics
    /**
     * Vercel Analytics track function
     * @see https://vercel.com/docs/analytics/custom-events
     */
    va?: (
      command: "event" | "pageview",
      payload?: Record<string, unknown>
    ) => void;

    /**
     * Vercel Web Analytics beforeSend callback
     * Return null to ignore the event, or the event object to track it
     * @see https://vercel.com/docs/analytics/redacting-sensitive-data
     */
    webAnalyticsBeforeSend?: (
      event: Record<string, unknown> & { url: string }
    ) => Record<string, unknown> | null;

    /**
     * Vercel Speed Insights beforeSend callback
     */
    speedInsightsBeforeSend?: (
      data: Record<string, unknown>
    ) => Record<string, unknown> | null;
  }
}
