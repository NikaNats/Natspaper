/**
 * Astro Integration: Environment Validation
 *
 * Validates environment variables during build time.
 * If critical variables are missing, build fails with helpful error messages.
 */

import type { AstroIntegration } from "astro";
import { envManager } from "../env";

/**
 * Format validation errors for console output
 */
function formatValidationOutput(): string {
  if (!envManager) {
    return ""; // Environment manager not available in this context
  }

  const errors = envManager.getErrors();
  const warnings = envManager.getWarnings();

  let output = "";

  // Errors section
  if (errors.length > 0) {
    output += "\n" + "=".repeat(70) + "\n";
    output += "❌ ENVIRONMENT VALIDATION FAILED\n";
    output += "=".repeat(70) + "\n\n";

    for (const error of errors) {
      output += `❌ ${error.variable}\n`;
      output += `   ${error.message}\n\n`;
    }

    output += "=".repeat(70) + "\n";
    output += "⚠️  Build cannot proceed. Please fix the errors above.\n";
    output += "=".repeat(70) + "\n\n";
  }

  // Warnings section
  if (warnings.length > 0) {
    output += "\n" + "=".repeat(70) + "\n";
    output += "⚠️  ENVIRONMENT WARNINGS (Non-critical)\n";
    output += "=".repeat(70) + "\n\n";

    for (const warning of warnings) {
      output += `⚠️  ${warning.variable}\n`;
      output += `   ${warning.message}\n\n`;
    }

    output +=
      "ℹ️  These are optional. Your build will succeed, but some features may be limited.\n";
    output += "=".repeat(70) + "\n\n";
  }

  return output;
}

/**
 * Astro integration for environment validation
 */
export const envValidationIntegration = (): AstroIntegration => {
  return {
    name: "env-validation",
    hooks: {
      "astro:build:start": async () => {
        if (!envManager) {
          return; // Environment manager not available
        }

        const isValid = envManager.validate();
        const output = formatValidationOutput();

        if (output) {
          if (isValid) {
            // eslint-disable-next-line no-console
            console.warn(output);
          } else {
            // eslint-disable-next-line no-console
            console.error(output);
            process.exit(1);
          }
        }
      },
    },
  };
};
