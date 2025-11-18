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
 * - CopyButtons: Copy-to-clipboard buttons for code blocks
 * - HeadingLinks: Clickable anchor links for headings
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
  private features: Feature[] = [];

  constructor() {
    // The list of all features to manage. Open for extension!
    // To add a new feature, simply create a new class implementing Feature
    // and add an instance of it to this array.
    this.features = [new ProgressBar(), new HeadingLinks()];
  }

  /**
   * Initialize all features
   * Calls init() on each feature in the correct order
   * Safe to call multiple times (re-initialization for page transitions)
   */
  public initializeFeatures(): void {
    this.features.forEach(feature => feature.init());
  }

  /**
   * Clean up all features
   * Calls cleanup() on each feature to prevent memory leaks
   * Essential for proper cleanup during page transitions
   */
  public cleanupFeatures(): void {
    this.features.forEach(feature => feature.cleanup());
  }
}

// Create a single, global instance of the manager.
// This follows the Singleton pattern for client-side feature management.
export const featureManager = new FeatureManager();
