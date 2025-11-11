/**
 * Environment Management System
 *
 * Type-safe loading and validation of environment variables.
 */

import type { EnvSchema } from "./schema";
import { ENV_DEFINITIONS } from "./schema";
import type { ValidatorFn } from "./validators";

// Extended schema definition with validators
interface EnvDefinitionWithValidators {
  type: string;
  required?: boolean;
  access: string;
  context: string;
  validators: readonly ValidatorFn[];
  severity?: "error" | "warning";
  [key: string]: unknown; // For other properties
}

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
   * REFACTORED: The validate method is now a generic, extensible loop.
   * It no longer contains any hard-coded logic for specific variables.
   */
  validate(): boolean {
    this.errors = [];
    this.warnings = [];

    for (const [key, definition] of Object.entries(ENV_DEFINITIONS)) {
      const value = this.env[key];

      // Safe cast since we know our schema structure
      const def = definition as EnvDefinitionWithValidators;
      const validators = def.validators || [];
      const severity = def.severity || "error"; // Default to error

      for (const validator of validators) {
        const errorMessage = validator(value, key);
        if (errorMessage) {
          const issue = { variable: key, message: errorMessage, severity };
          if (severity === "error") {
            this.errors.push(issue);
          } else {
            this.warnings.push(issue);
          }
        }
      }
    }

    return this.errors.length === 0;
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
// Only instantiate on server-side environments where process.env is available
export const envManager =
  typeof process !== "undefined" && process.env
    ? new EnvironmentManager()
    : null;

// ============================================================
// PUBLIC API - Type-safe environment variable access
// ============================================================

/**
 * Get environment variable (returns undefined if not set)
 */
export function getEnv<K extends keyof EnvSchema>(
  key: K
): EnvSchema[K] | undefined {
  if (!envManager) return undefined;
  return envManager.get(key);
}

/**
 * Get environment variable or throw error
 */
export function getEnvOrThrow<K extends keyof EnvSchema>(key: K): EnvSchema[K] {
  if (!envManager) {
    throw new Error(
      "Environment manager is not available in this context. " +
        "This function can only be called on the server side."
    );
  }
  return envManager.getOrThrow(key);
}

/**
 * Get environment variable with fallback default
 */
export function getEnvOrDefault<K extends keyof EnvSchema>(
  key: K,
  defaultValue: EnvSchema[K]
): EnvSchema[K] {
  if (!envManager) return defaultValue;
  return envManager.getOrDefault(key, defaultValue);
}

/**
 * Check if environment variable is set
 */
export function hasEnv<K extends keyof EnvSchema>(key: K): boolean {
  if (!envManager) return false;
  return envManager.has(key);
}

// Export for integration use
export { type EnvSchema, ENV_DEFINITIONS } from "./schema";
export type { ValidationError };
