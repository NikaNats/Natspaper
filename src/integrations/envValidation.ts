/**
 * Astro Build Hook: Environment Validation
 *
 * This hook runs before the build process starts and validates
 * all required environment variables are set correctly.
 *
 * Add to astro.config.ts:
 * ```ts
 * import { validateBuildEnvironment, logValidationResults } from './src/utils/envValidation';
 *
 * export default defineConfig({
 *   // ... other config
 *   hooks: {
 *     'astro:build:start': () => {
 *       const validation = validateBuildEnvironment();
 *       logValidationResults(validation);
 *     },
 *   },
 * });
 * ```
 */

import type { AstroIntegration } from "astro";
import {
  validateBuildEnvironment,
  logValidationResults,
} from "../utils/envValidation";

/**
 * Astro integration for environment validation at build time
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
