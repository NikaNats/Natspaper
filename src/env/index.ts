/**
 * Environment Management System
 *
 * Type-safe loading and validation of environment variables.
 */

import type { EnvSchema } from "./schema";
import { ENV_DEFINITIONS, getRequiredVars } from "./schema";

/**
 * Validation error details
 */
interface ValidationError {
  variable: string;
  severity: "error" | "warning";
  message: string;
}

/**
 * Environment Manager Class
 * Handles loading, validation, and type-safe access to env vars
 */
class EnvironmentManager {
  private readonly env: Record<string, string | undefined>;
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  constructor() {
    // Create snapshot of process.env at initialization
    this.env = { ...process.env };
  }

  /**
   * Validate all environment variables
   * Called once at build time by the validation integration
   */
  validate(): boolean {
    this.errors = [];
    this.warnings = [];

    // Check required variables
    const requiredVars = getRequiredVars();
    for (const varName of requiredVars) {
      const value = this.env[varName];

      if (!value || value.trim() === "") {
        this.errors.push({
          variable: varName,
          severity: "error",
          message: `Required environment variable is missing or empty: ${varName}`,
        });
      }
    }

    // Type validation for enum values
    if (this.env.NODE_ENV) {
      const def = ENV_DEFINITIONS.NODE_ENV;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (def.type === "enum" && !def.values?.includes(this.env.NODE_ENV as any)) {
        this.errors.push({
          variable: "NODE_ENV",
          severity: "error",
          message: `Invalid NODE_ENV value: "${this.env.NODE_ENV}". Must be one of: ${def.values?.join(", ")}`,
        });
      }
    }

    // Validate Sentry DSN format (if provided)
    const sentryDsn = this.env.SENTRY_DSN || this.env.PUBLIC_SENTRY_DSN;
    if (sentryDsn && !this.isValidSentryDsn(sentryDsn)) {
      this.warnings.push({
        variable: "SENTRY_DSN",
        severity: "warning",
        message: `SENTRY_DSN format looks invalid. Should be like: https://key@sentry.io/project-id`,
      });
    }

    // Validate sampling rates (0-1)
    const samplingVars = [
      "SENTRY_TRACE_SAMPLE_RATE",
      "PUBLIC_SENTRY_TRACES_SAMPLE_RATE",
      "PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE",
      "PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE",
    ];

    for (const varName of samplingVars) {
      const value = this.env[varName];
      if (value !== undefined) {
        const rate = parseFloat(value);
        if (isNaN(rate) || rate < 0 || rate > 1) {
          this.errors.push({
            variable: varName,
            severity: "error",
            message: `${varName} must be a number between 0 and 1, got: "${value}"`,
          });
        }
      }
    }

    return this.errors.length === 0;
  }

  /**
   * Basic Sentry DSN format validation
   */
  private isValidSentryDsn(dsn: string): boolean {
    try {
      const url = new URL(dsn);
      return url.protocol === "https:" && url.hostname.includes("sentry.io");
    } catch {
      return false;
    }
  }

  /**
   * Get all validation errors
   */
  getErrors(): ValidationError[] {
    return this.errors;
  }

  /**
   * Get all validation warnings
   */
  getWarnings(): ValidationError[] {
    return this.warnings;
  }

  /**
   * Type-safe environment variable getter
   * Returns undefined if variable is not set
   */
  get<K extends keyof EnvSchema>(key: K): EnvSchema[K] | undefined {
    return this.env[key] as EnvSchema[K] | undefined;
  }

  /**
   * Type-safe environment variable getter
   * Throws if variable is not set
   */
  getOrThrow<K extends keyof EnvSchema>(key: K): EnvSchema[K] {
    const value = this.env[key];
    if (!value) {
      throw new Error(
        `Required environment variable is not set: ${String(key)}\n` +
          `Check your .env file or environment configuration.`
      );
    }
    return value as EnvSchema[K];
  }

  /**
   * Get with default value
   */
  getOrDefault<K extends keyof EnvSchema>(
    key: K,
    defaultValue: EnvSchema[K]
  ): EnvSchema[K] {
    return (this.env[key] as EnvSchema[K]) ?? defaultValue;
  }

  /**
   * Check if variable is set
   */
  has<K extends keyof EnvSchema>(key: K): boolean {
    return Boolean(this.env[key]);
  }

  /**
   * Get all variables as object
   */
  toJSON(): Partial<EnvSchema> {
    return { ...this.env } as Partial<EnvSchema>;
  }

  /**
   * Get all variables with definitions
   */
  getDefinitions() {
    return ENV_DEFINITIONS;
  }
}

// Singleton instance
export const envManager = new EnvironmentManager();

// ============================================================
// PUBLIC API - Type-safe environment variable access
// ============================================================

/**
 * Get environment variable (returns undefined if not set)
 */
export function getEnv<K extends keyof EnvSchema>(
  key: K
): EnvSchema[K] | undefined {
  return envManager.get(key);
}

/**
 * Get environment variable or throw error
 */
export function getEnvOrThrow<K extends keyof EnvSchema>(
  key: K
): EnvSchema[K] {
  return envManager.getOrThrow(key);
}

/**
 * Get environment variable with fallback default
 */
export function getEnvOrDefault<K extends keyof EnvSchema>(
  key: K,
  defaultValue: EnvSchema[K]
): EnvSchema[K] {
  return envManager.getOrDefault(key, defaultValue);
}

/**
 * Check if environment variable is set
 */
export function hasEnv<K extends keyof EnvSchema>(key: K): boolean {
  return envManager.has(key);
}

// Export for integration use
export { type EnvSchema, ENV_DEFINITIONS } from "./schema";
export type { ValidationError };
