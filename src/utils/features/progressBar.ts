/**
 * Progress Bar Feature Class
 * Creates and manages a visual reading progress indicator.
 *
 * Performance Architecture (W3C Scroll-driven Animations):
 * - In engines supporting CSS scroll-driven animations, components.css
 *   overrides the JS width with a compositor-accelerated transform: scaleX()
 *   driven by `animation-timeline: scroll()`.
 * - In test environments (happy-dom, where CSS.supports() reports no support)
 *   and legacy engines, the passive JS scroll listener updates width for 100%
 *   backward compatibility — the unit suite pins these class names and the
 *   width contract.
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
    // Class names are pinned by tests/unit/features/progressBar.test.ts
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
   * Kept attached even on scroll-timeline engines: the CSS override wins over
   * the inline style there, while test runners and fallback engines rely on it.
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
      // Guard against division by zero on non-scrollable pages
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;

      this.bar.style.width = `${scrolled}%`;
    };

    document.addEventListener("scroll", this.scrollListener, { passive: true });
  }
}
