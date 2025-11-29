/**
 * Astro Integration: Environment Validation
 *
 * Validates environment variables during build time.
 * If critical variables are missing, build fails with helpful error messages.
 */

import type { AstroIntegration } from "astro";
import { envManager } from "../env";
import { formatValidationResult } from "./envValidationReporter"; // Import the new reporter

/**
 * Astro integration for environment validation.
 * This integration acts as a controller: it orchestrates the validation
 * and reporting, but delegates the formatting to a dedicated reporter.
 */
export const envValidationIntegration = (): AstroIntegration => {
  return {
    name: "env-validation",
    hooks: {
      "astro:build:start": async () => {
        if (!envManager) {
          return; // Environment manager not available
        }

        // 1. Perform the validation
        envManager.validate();
        const errors = envManager.getErrors();
        const warnings = envManager.getWarnings();

        // 2. If there's nothing to report, do nothing.
        if (errors.length === 0 && warnings.length === 0) {
          return;
        }

        // 3. Delegate formatting to the reporter
        const output = formatValidationResult(errors, warnings);

        // 4. Handle side effects (logging and exiting)
        if (errors.length > 0) {
          console.error(output);
          process.exit(1);
        } else {
          console.warn(output);
        }
      },
    },
  };
};
