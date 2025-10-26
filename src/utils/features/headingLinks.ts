/**
 * Heading Links Feature Module
 * Adds clickable anchor links to document headings for easy sharing and navigation
 *
 * Features:
 * - Automatically discovers all headings (h2-h6)
 * - Creates anchor links with consistent styling
 * - Shows/hides link symbol on hover (desktop) or always visible (mobile)
 * - Safe re-initialization for page transitions (Astro Islands)
 *
 * Usage in Astro components:
 * ```ts
 * import { initHeadingLinks } from "@/utils/features/headingLinks";
 * document.addEventListener('astro:page-load', initHeadingLinks);
 * document.addEventListener('astro:after-swap', initHeadingLinks);
 * ```
 */

/**
 * Add heading anchor links to all h2-h6 elements
 * Each heading becomes clickable and shareable
 * Re-initialization safely handles newly added headings
 */
export function initHeadingLinks(): void {
  // Find all headings that don't already have a link
  // (prevents duplicate links during re-initialization)
  const headings = Array.from(
    document.querySelectorAll(
      "h2:not(.has-heading-link), h3:not(.has-heading-link), h4:not(.has-heading-link), h5:not(.has-heading-link), h6:not(.has-heading-link)"
    )
  );

  for (const heading of headings) {
    heading.classList.add("group", "has-heading-link");

    const link = document.createElement("a");
    link.className =
      "heading-link ms-2 no-underline opacity-75 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100";
    link.href = "#" + heading.id;
    link.title = "Link to this section";

    const span = document.createElement("span");
    span.ariaHidden = "true";
    span.innerText = "#";
    link.appendChild(span);
    heading.appendChild(link);
  }
}
