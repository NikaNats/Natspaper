/**
 * Astro Integration: Environment Validation
 *
 * This integration runs before the build process starts and validates
 * all required environment variables are set correctly.
 *
 * Usage:
 * ```ts
 * import { envValidationIntegration } from './src/integrations/envValidation';
 *
 * export default defineConfig({
 *   integrations: [envValidationIntegration()],
 * });
 * ```
 */

import type { AstroIntegration } from "astro";

export interface EnvValidationOptions {
  name: string;
  value: string | undefined;
  required: boolean;
  context: "build" | "runtime";
  description: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a single environment variable
 */
function validateEnvVariable(options: EnvValidationOptions): {
  valid: boolean;
  message?: string;
} {
  const { name, value, required, description } = options;

  if (required && !value) {
    return {
      valid: false,
      message: `
❌ MISSING REQUIRED ENVIRONMENT VARIABLE: ${name}

Description: ${description}

Action Required:
1. Create or update .env.local file
2. Add: ${name}=<your_value>
3. For details, see: .env.example

Documentation:
- Setup Guide: https://github.com/NikaNats/Natspaper#configuration
- Environment Variables: .env.example
      `.trim(),
    };
  }

  if (value && value.trim() === "") {
    return {
      valid: false,
      message: `
⚠️  EMPTY ENVIRONMENT VARIABLE: ${name}

The variable is set but has no value. Please provide a valid value.

Current: ${name}=

Action Required:
1. Edit .env.local
2. Set: ${name}=<your_value>

Documentation: .env.example
      `.trim(),
    };
  }

  return { valid: true };
}

/**
 * Validate all critical environment variables
 * This runs at build time to catch issues early
 */
function validateBuildEnvironment(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Critical variables that must be set
  const criticalVars: EnvValidationOptions[] = [
    {
      name: "SITE_WEBSITE",
      value: process.env.SITE_WEBSITE,
      required: true,
      context: "build",
      description: "Your production domain (e.g., https://example.com)",
    },
  ];

  // Optional but recommended variables
  const recommendedVars: EnvValidationOptions[] = [
    {
      name: "SENTRY_AUTH_TOKEN",
      value: process.env.SENTRY_AUTH_TOKEN,
      required: false,
      context: "build",
      description: "Sentry auth token for error tracking integration",
    },
    {
      name: "PUBLIC_SENTRY_DSN",
      value: process.env.PUBLIC_SENTRY_DSN,
      required: false,
      context: "build",
      description: "Sentry DSN for client-side error tracking",
    },
  ];

  // Validate critical variables
  for (const variable of criticalVars) {
    const validation = validateEnvVariable(variable);
    if (!validation.valid) {
      result.valid = false;
      result.errors.push(validation.message || `${variable.name} is invalid`);
    }
  }

  // Check recommended variables
  for (const variable of recommendedVars) {
    if (!variable.value && !process.env[variable.name.replace("PUBLIC_", "")]) {
      result.warnings.push(
        `ℹ️  Optional: ${variable.name} is not configured. ${variable.description}`
      );
    }
  }

  return result;
}

/**
 * Log validation results and exit if there are errors
 */
function logValidationResults(result: ValidationResult): void {
  if (result.errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error("\n" + "=".repeat(70));
    // eslint-disable-next-line no-console
    console.error("🚨 ENVIRONMENT VALIDATION FAILED");
    // eslint-disable-next-line no-console
    console.error("=".repeat(70) + "\n");

    for (const error of result.errors) {
      // eslint-disable-next-line no-console
      console.error(error);
      // eslint-disable-next-line no-console
      console.error("");
    }

    // eslint-disable-next-line no-console
    console.error("=".repeat(70));
    // eslint-disable-next-line no-console
    console.error(
      "Build cannot proceed. Please fix the errors above and try again."
    );
    // eslint-disable-next-line no-console
    console.error("=".repeat(70) + "\n");

    process.exit(1);
  }

  if (result.warnings.length > 0) {
    // eslint-disable-next-line no-console
    console.warn("\n" + "=".repeat(70));
    // eslint-disable-next-line no-console
    console.warn("⚠️  ENVIRONMENT WARNINGS");
    // eslint-disable-next-line no-console
    console.warn("=".repeat(70) + "\n");

    for (const warning of result.warnings) {
      // eslint-disable-next-line no-console
      console.warn(warning);
    }

    // eslint-disable-next-line no-console
    console.warn(
      "\nℹ️  These are optional. Your build will succeed, but some features may be disabled."
    );
    // eslint-disable-next-line no-console
    console.warn("=".repeat(70) + "\n");
  }
}

/**
 * Astro integration for environment validation at build time
 */
export const envValidationIntegration = (): AstroIntegration => {
  return {
    name: "env-validation",
    hooks: {
      "astro:build:start": async () => {
        const validation = validateBuildEnvironment();
        logValidationResults(validation);
      },
    },
  };
};
