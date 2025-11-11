export interface AnalyticsEvent {
  name: string;
  params: Record<string, string | number | boolean>;
}

export interface AnalyticsProvider {
  init(locale: string): void;
  track(event: AnalyticsEvent): void;
  setUserProperty(properties: Record<string, string | number | boolean>): void;
}
