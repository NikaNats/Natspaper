// This schema describes each Sentry config option.
// It's the new, declarative "single source of truth".

const isDev = import.meta.env.MODE === "development";

type EnvVarConfig = string[] | { client: string[]; server: string[] };

interface BaseSchemaItem {
  envVars: EnvVarConfig;
  type: "string" | "float";
}

interface SchemaItemWithDefault extends BaseSchemaItem {
  default: string | number;
}

interface SchemaItemWithoutDefault extends BaseSchemaItem {
  default?: never;
}

type SchemaItem = SchemaItemWithDefault | SchemaItemWithoutDefault;

export const SENTRY_CONFIG_SCHEMA: Record<string, SchemaItem> = {
  dsn: {
    // We can handle context-specific logic declaratively
    envVars: {
      client: ["PUBLIC_SENTRY_DSN"],
      server: ["SENTRY_DSN", "PUBLIC_SENTRY_DSN"],
    },
    type: "string",
  },
  environment: {
    envVars: ["PUBLIC_SENTRY_ENVIRONMENT"],
    type: "string",
    default: isDev ? "development" : "production",
  },
  tracesSampleRate: {
    envVars: ["PUBLIC_SENTRY_TRACES_SAMPLE_RATE", "SENTRY_TRACE_SAMPLE_RATE"],
    type: "float",
    default: isDev ? 1.0 : 0.1,
  },
  replaysSessionSampleRate: {
    envVars: ["PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE"],
    type: "float",
    default: 0.1,
  },
  replaysOnErrorSampleRate: {
    envVars: ["PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE"],
    type: "float",
    default: 1.0,
  },
} as const;
