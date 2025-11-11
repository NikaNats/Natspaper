/**
 * Heading Links Feature Class
 * Adds clickable anchor links to document headings for easy sharing and navigation
 *
 * Features:
 * - Automatically discovers all headings (h2-h6)
 * - Creates anchor links with consistent styling
 * - Shows/hides link symbol on hover (desktop) or always visible (mobile)
 * - Safe re-initialization for page transitions (Astro Islands)
 * - Proper cleanup for memory management
 *
 * Usage:
 * ```ts
 * const headingLinks = new HeadingLinks();
 * headingLinks.init(); // Initialize the feature
 * headingLinks.cleanup(); // Clean up when done
 * ```
 */

import type { Feature } from "./Feature";

export class HeadingLinks implements Feature {
  /**
   * Initialize the heading links feature
   * Adds heading anchor links to all h2-h6 elements that don't already have them
   * Each heading becomes clickable and shareable
   * Safe to call multiple times (re-initialization for page transitions)
   */
  public init(): void {
    const headings = Array.from(
      document.querySelectorAll(
        "h2:not(.has-heading-link), h3:not(.has-heading-link), h4:not(.has-heading-link), h5:not(.has-heading-link), h6:not(.has-heading-link)"
      )
    );

    for (const heading of headings) {
      this.attachLinkToHeading(heading as HTMLElement);
    }
  }

  /**
   * Clean up the heading links feature
   * Since links are part of the DOM that gets replaced during navigation,
   * cleanup is less critical here, but good practice for consistency
   */
  public cleanup(): void {
    // Links are part of the DOM that gets replaced, so manual cleanup is less critical here,
    // but good practice for more complex listeners or persistent state.
  }

  /**
   * Attach an anchor link to a specific heading
   * Creates a clickable link with hover effects for navigation
   */
  private attachLinkToHeading(heading: HTMLElement): void {
    heading.classList.add("group", "has-heading-link");

    const link = document.createElement("a");
    link.className =
      "heading-link absolute left-[-1em] no-underline opacity-0 group-hover:opacity-75 focus:opacity-75";
    link.href = "#" + heading.id;
    link.title = "Link to this section";

    const span = document.createElement("span");
    span.ariaHidden = "true";
    span.innerText = "#";
    link.appendChild(span);

    heading.appendChild(link);
  }
}
