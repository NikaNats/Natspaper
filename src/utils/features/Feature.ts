/**
 * Feature Interface
 * Defines the contract that all feature classes must implement.
 * This follows the Dependency Inversion Principle by defining
 * a common interface for all features.
 */
export interface Feature {
  /**
   * Initializes the feature, adding elements and event listeners.
   * Should be idempotent (safe to call multiple times).
   */
  init(): void;

  /**
   * Cleans up the feature, removing elements and listeners.
   * Essential for preventing memory leaks during page transitions.
   */
  cleanup(): void;
}
