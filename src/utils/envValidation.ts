/**
 * Environment Variable Validation Utility
 *
 * This utility provides runtime validation of environment variables
 * with helpful error messages for missing or invalid configurations.
 *
 * Used during build-time to catch configuration issues early.
 */

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
export function validateEnvVariable(options: EnvValidationOptions): {
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
export function validateBuildEnvironment(): ValidationResult {
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
export function logValidationResults(result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.error("\n" + "=".repeat(70));
    console.error("🚨 ENVIRONMENT VALIDATION FAILED");
    console.error("=".repeat(70) + "\n");

    result.errors.forEach(error => {
      console.error(error);
      console.error("");
    });

    console.error("=".repeat(70));
    console.error(
      "Build cannot proceed. Please fix the errors above and try again."
    );
    console.error("=".repeat(70) + "\n");

    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.warn("\n" + "=".repeat(70));
    console.warn("⚠️  ENVIRONMENT WARNINGS");
    console.warn("=".repeat(70) + "\n");

    result.warnings.forEach(warning => {
      console.warn(warning);
    });

    console.warn(
      "\nℹ️  These are optional. Your build will succeed, but some features may be disabled."
    );
    console.warn("=".repeat(70) + "\n");
  }
}

/**
 * Helper: Check if running in production
 */
export function isProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

/**
 * Helper: Check if running in build environment
 */
export function isBuildTime(): boolean {
  // Check if running in build context
  return (
    process.env.npm_lifecycle_event?.includes("build") ||
    process.env.GITHUB_ACTIONS === "true" ||
    process.env.VERCEL === "1"
  );
}
