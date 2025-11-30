/// <reference types="astro/client" />

/**
 * Feature Flag Manager
 * ====================
 * Centralized feature toggle system that enables:
 * - Runtime feature checks
 * - Environment-based overrides
 * - Type-safe feature definitions
 * - Easy addition of new features
 *
 * DESIGN PATTERN: Dependency Inversion
 * - High-level components depend on this abstraction
 * - Low-level feature implementations are decoupled
 *
 * EXTENSIBILITY:
 * - Add new features without modifying existing code
 * - Features can be toggled via environment variables
 * - Supports staged rollouts and A/B testing
 *
 * @example
 * ```typescript
 * import { FeatureFlags, isFeatureEnabled } from '@/config/features';
 *
 * if (isFeatureEnabled('newsletter')) {
 *   // Render newsletter signup
 * }
 * ```
 */

import { FEATURES, GISCUS } from "../src/config";

/**
 * Feature Flag Definitions
 * Each feature has a key, description, and default state
 */
export interface FeatureDefinition {
  /** Human-readable description */
  description: string;
  /** Default enabled state */
  defaultEnabled: boolean;
  /** Environment variable override key */
  envKey?: string;
  /** Dependencies - other features that must be enabled */
  requires?: FeatureKey[];
}

/**
 * All available feature keys
 * Add new features here - the type system will enforce usage
 */
export type FeatureKey =
  | "darkMode"
  | "comments"
  | "newsletter"
  | "relatedPosts"
  | "readingProgress"
  | "tableOfContents"
  | "shareLinks"
  | "analytics"
  | "editPost"
  | "archives"
  | "rss"
  | "dynamicOgImages"
  | "backToTop";

/**
 * Feature Registry
 * Central definition of all features and their configuration
 */
export const FeatureRegistry: Record<FeatureKey, FeatureDefinition> = {
  darkMode: {
    description: "Light/Dark mode toggle",
    defaultEnabled: FEATURES.lightAndDarkMode,
    envKey: "PUBLIC_FEATURE_DARK_MODE",
  },
  comments: {
    description: "Giscus comment system",
    defaultEnabled: GISCUS.enabled && !!GISCUS.repo,
    envKey: "PUBLIC_FEATURE_COMMENTS",
  },
  newsletter: {
    description: "Newsletter subscription form",
    defaultEnabled: false, // Not yet implemented
    envKey: "PUBLIC_FEATURE_NEWSLETTER",
  },
  relatedPosts: {
    description: "Related posts suggestions at end of articles",
    defaultEnabled: false, // Not yet implemented
    envKey: "PUBLIC_FEATURE_RELATED_POSTS",
  },
  readingProgress: {
    description: "Reading progress bar on articles",
    defaultEnabled: true,
    envKey: "PUBLIC_FEATURE_READING_PROGRESS",
  },
  tableOfContents: {
    description: "Table of contents sidebar on articles",
    defaultEnabled: true,
    envKey: "PUBLIC_FEATURE_TOC",
  },
  shareLinks: {
    description: "Social sharing buttons on posts",
    defaultEnabled: true,
    envKey: "PUBLIC_FEATURE_SHARE",
  },
  analytics: {
    description: "Vercel Analytics integration",
    defaultEnabled: true,
    envKey: "PUBLIC_FEATURE_ANALYTICS",
  },
  editPost: {
    description: "Edit on GitHub link on posts",
    defaultEnabled: FEATURES.editPost.enabled,
    envKey: "PUBLIC_FEATURE_EDIT_POST",
  },
  archives: {
    description: "Archives page and navigation",
    defaultEnabled: FEATURES.showArchives,
    envKey: "PUBLIC_FEATURE_ARCHIVES",
  },
  rss: {
    description: "RSS feed generation",
    defaultEnabled: true,
    envKey: "PUBLIC_FEATURE_RSS",
  },
  dynamicOgImages: {
    description: "Auto-generated OpenGraph images for posts",
    defaultEnabled: FEATURES.dynamicOgImage,
    envKey: "PUBLIC_FEATURE_DYNAMIC_OG",
  },
  backToTop: {
    description: "Back to top button on scroll",
    defaultEnabled: true,
    envKey: "PUBLIC_FEATURE_BACK_TO_TOP",
  },
};

/**
 * Check if a feature is enabled
 *
 * Priority order:
 * 1. Environment variable override (if defined)
 * 2. Default enabled state from registry
 *
 * @param feature - Feature key to check
 * @returns boolean indicating if feature is enabled
 */
export function isFeatureEnabled(feature: FeatureKey): boolean {
  const definition = FeatureRegistry[feature];

  if (!definition) {
    console.warn(`Unknown feature flag: ${feature}`);
    return false;
  }

  // Check environment variable override
  if (definition.envKey) {
    const envValue = import.meta.env[definition.envKey];
    if (envValue !== undefined) {
      return envValue === "true" || envValue === "1";
    }
  }

  // Check required dependencies
  if (definition.requires) {
    const allDepsEnabled = definition.requires.every(dep =>
      isFeatureEnabled(dep)
    );
    if (!allDepsEnabled) {
      return false;
    }
  }

  return definition.defaultEnabled;
}

/**
 * Get all enabled features
 * Useful for debugging and analytics
 */
export function getEnabledFeatures(): FeatureKey[] {
  return (Object.keys(FeatureRegistry) as FeatureKey[]).filter(isFeatureEnabled);
}

/**
 * Get feature configuration for client-side use
 * Returns a serializable object of enabled states
 */
export function getFeatureFlags(): Record<FeatureKey, boolean> {
  const flags = {} as Record<FeatureKey, boolean>;

  for (const key of Object.keys(FeatureRegistry) as FeatureKey[]) {
    flags[key] = isFeatureEnabled(key);
  }

  return flags;
}

/**
 * Type-safe feature guard for conditional rendering
 *
 * @example
 * ```astro
 * {withFeature('newsletter', <NewsletterForm />)}
 * ```
 */
export function withFeature<T>(
  feature: FeatureKey,
  component: T,
  fallback?: T
): T | null {
  if (isFeatureEnabled(feature)) {
    return component;
  }
  return fallback ?? null;
}

// Re-export for convenience
export { FEATURES, GISCUS };
