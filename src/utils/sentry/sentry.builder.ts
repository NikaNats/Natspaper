import { getEnv } from "@/env";
import { SENTRY_CONFIG_SCHEMA } from "./sentry.schema";
import type { SentryConfig } from "./config";

type Context = "client" | "server";

/**
 * A generic builder that constructs the Sentry config object from a declarative schema.
 * This function is "closed for modification".
 */
export function buildSentryConfig(context: Context): SentryConfig {
  const config: Record<string, unknown> = {};

  for (const [key, schema] of Object.entries(SENTRY_CONFIG_SCHEMA)) {
    const envVarNames = Array.isArray(schema.envVars)
      ? schema.envVars
      : schema.envVars[context] || [];
    let value: string | undefined;

    // Find the first available environment variable
    for (const name of envVarNames) {
      value = getEnv(name as keyof import("@/env").EnvSchema);
      if (value) break;
    }

    // Apply default if no value was found
    if (value === undefined && "default" in schema) {
      config[key] = schema.default;
      continue;
    }

    // Parse the value based on its type
    if (value !== undefined) {
      switch (schema.type) {
        case "float":
          config[key] = parseFloat(value);
          break;
        case "string":
        default:
          config[key] = value;
          break;
      }
    }
  }

  // Finalize the config object
  return {
    dsn: (config.dsn as string) || "",
    enabled: Boolean(config.dsn),
    environment: config.environment as string,
    tracesSampleRate: config.tracesSampleRate as number,
    replaysSessionSampleRate: config.replaysSessionSampleRate as number,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate as number,
  };
}
