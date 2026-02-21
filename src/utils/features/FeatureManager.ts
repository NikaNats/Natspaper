/**
 * Feature Manager Class
 * Central controller for all post-related dynamic features
 *
 * This class follows the Open/Closed Principle: it's open for extension
 * (you can add new features) but closed for modification (you don't
 * need to change the manager's logic to add features).
 *
 * Features managed:
 * - ProgressBar: Visual scroll position indicator
 * - HeadingLinks: Clickable anchor links for headings
 *   (Copy button functionality is handled natively by astro-expressive-code)
 *
 * Usage:
 * ```ts
 * import { featureManager } from "@/utils/features/FeatureManager";
 *
 * // Initialize all features
 * featureManager.initializeFeatures();
 *
 * // Clean up all features (e.g., before page navigation)
 * featureManager.cleanupFeatures();
 * ```
 */

import type { Feature } from "./Feature";
import { ProgressBar } from "./progressBar";
import { HeadingLinks } from "./headingLinks";

class FeatureManager {
  /**
   * Accepts an optional initial list of features for testability (Dependency
   * Injection).  In production the singleton below uses `register()` to add
   * features, keeping construction side-effect-free.
   */
  constructor(private readonly features: Feature[] = []) {}

  /**
   * Register a feature with the manager.  Follows the Open/Closed Principle:
   * adding a new feature never requires modifying this class.
   *
   * @example
   * featureManager.register(new MyNewFeature());
   */
  public register(feature: Feature): void {
    this.features.push(feature);
  }

  /**
   * Initialize all features.
   * Calls init() on each feature in registration order.
   * Safe to call multiple times (re-initialization for page transitions).
   */
  public initializeFeatures(): void {
    this.features.forEach(feature => feature.init());
  }

  /**
   * Clean up all features.
   * Calls cleanup() on each feature to prevent memory leaks.
   * Essential for proper teardown during page transitions.
   */
  public cleanupFeatures(): void {
    this.features.forEach(feature => feature.cleanup());
  }
}

// Singleton — features are registered here, not hard-wired in the
// constructor, so tests can inject their own implementations without
// coupling to concrete classes.
export const featureManager = new FeatureManager();
featureManager.register(new ProgressBar());
featureManager.register(new HeadingLinks());
