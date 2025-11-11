/**
 * Progress Bar Feature Class
 * Creates and manages a visual progress indicator that shows scroll position
 *
 * Features:
 * - Fixed positioning at top of page for visibility during scroll
 * - Smooth width transitions based on scroll percentage
 * - Safe re-initialization for page transitions (Astro Islands)
 * - Passive scroll listener for optimal performance
 * - Proper cleanup to prevent memory leaks
 *
 * Usage:
 * ```ts
 * const progressBar = new ProgressBar();
 * progressBar.init(); // Initialize the feature
 * progressBar.cleanup(); // Clean up when done
 * ```
 */

import type { Feature } from "./Feature";

export class ProgressBar implements Feature {
  private container: HTMLElement | null = null;
  private bar: HTMLElement | null = null;
  private scrollListener: (() => void) | null = null;

  /**
   * Initialize the progress bar feature
   * Creates the DOM elements and attaches scroll listener
   * Safe to call multiple times (re-initialization for page transitions)
   */
  public init(): void {
    this.cleanup(); // Ensure any previous instance is removed

    this.container = document.createElement("div");
    this.container.id = "progress-container";
    this.container.className =
      "progress-container fixed top-0 z-10 h-1 w-full bg-background";

    this.bar = document.createElement("div");
    this.bar.id = "myBar";
    this.bar.className = "progress-bar h-1 w-0 bg-accent";

    this.container.appendChild(this.bar);
    document.body.appendChild(this.container);

    this.attachScrollListener();
  }

  /**
   * Clean up the progress bar feature
   * Removes DOM elements and event listeners to prevent memory leaks
   */
  public cleanup(): void {
    if (this.scrollListener) {
      document.removeEventListener("scroll", this.scrollListener);
      this.scrollListener = null;
    }
    this.container?.remove();
    this.container = null;
    this.bar = null;
  }

  /**
   * Attach scroll listener to update progress bar width
   * Uses passive event listener for optimal scroll performance
   */
  private attachScrollListener(): void {
    this.scrollListener = () => {
      if (!this.bar) return;

      const winScroll =
        document.body.scrollTop || document.documentElement.scrollTop;
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;

      this.bar.style.width = `${scrolled}%`;
    };

    document.addEventListener("scroll", this.scrollListener, { passive: true });
  }
}
