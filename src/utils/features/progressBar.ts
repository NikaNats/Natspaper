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
    // progress-bar-container/fill are the compositor-only article-scoped contract.
    this.container.className =
      "progress-container progress-bar-container fixed top-0 z-10 h-1 w-full bg-background";

    this.bar = document.createElement("div");
    this.bar.id = "myBar";
    this.bar.className = "progress-bar progress-bar-fill h-1 w-0 bg-accent";

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

      // Prefer article-scoped geometry so late-loading widgets (e.g. Giscus
      // iframe) expanding root scroll height don't make progress jump back.
      const article = document.getElementById("article");
      let scrolled = 0;
      if (article) {
        const rect = article.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const consumed = Math.min(Math.max(-rect.top, 0), Math.max(total, 0));
        scrolled = total > 0 ? (consumed / total) * 100 : 0;
        // Fall back to document geometry when article metrics are degenerate
        // (e.g. happy-dom test runner with zero layout boxes).
        if (
          !Number.isFinite(scrolled) ||
          (scrolled === 0 && rect.height === 0)
        ) {
          const winScroll =
            document.body.scrollTop || document.documentElement.scrollTop;
          const height =
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight;
          scrolled = height > 0 ? (winScroll / height) * 100 : 0;
        }
      } else {
        const winScroll =
          document.body.scrollTop || document.documentElement.scrollTop;
        const height =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;
        // Guard against division by zero on non-scrollable pages
        scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      }

      this.bar.style.width = `${scrolled}%`;
      // Keep compositor transform in sync for the view-timeline contract.
      this.bar.style.transform = `scaleX(${scrolled / 100})`;
    };

    document.addEventListener("scroll", this.scrollListener, { passive: true });
  }
}
