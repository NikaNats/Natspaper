/**
 * Config Module Exports
 * =====================
 * Central export point for all configuration modules.
 *
 * USAGE:
 * ```typescript
 * import { SITE, FEATURES, isFeatureEnabled } from '@/config';
 * // or
 * import { SITE, FEATURES, isFeatureEnabled } from '../config';
 * ```
 */

// Core site configuration
export { SITE, FEATURES, SOCIALS, NAVIGATION, GISCUS } from "../src/config";

// Feature flag system
export {
  isFeatureEnabled,
  getEnabledFeatures,
  getFeatureFlags,
  withFeature,
  FeatureRegistry,
  type FeatureKey,
  type FeatureDefinition,
} from "./features";

// Build integrations
export { getIntegrations } from "./integrations";

// Environment configuration
export { getEnvSchema } from "./env";

// Vite configuration utilities
export { getViteConfig } from "./vite";
