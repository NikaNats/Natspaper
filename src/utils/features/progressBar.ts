/**
 * Progress Bar Feature Module
 * Creates and manages a visual progress indicator that shows scroll position
 *
 * Features:
 * - Fixed positioning at top of page for visibility during scroll
 * - Smooth width transitions based on scroll percentage
 * - Safe re-initialization for page transitions (Astro Islands)
 * - Passive scroll listener for optimal performance
 *
 * Usage in Astro components:
 * ```ts
 * import { initProgressBar } from "@/utils/features/progressBar";
 * document.addEventListener('astro:page-load', initProgressBar);
 * document.addEventListener('astro:after-swap', initProgressBar);
 * ```
 */

// Track scroll listener to prevent duplicate listeners on re-initialization
let scrollListenerAttached = false;

/**
 * Create or reset a progress indicator container at the top of the page
 * Container uses fixed positioning to stay visible during scroll
 * Bar fills from left to right as user scrolls down the page
 */
function createProgressBar(): void {
  // Remove existing progress bar if present (prevents duplicates during re-initialization)
  const existing = document.getElementById("progress-container");
  if (existing) {
    existing.remove();
  }

  const progressContainer = document.createElement("div");
  progressContainer.id = "progress-container";
  progressContainer.className =
    "progress-container fixed top-0 z-10 h-1 w-full bg-background";

  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar h-1 w-0 bg-accent";
  progressBar.id = "myBar";

  progressContainer.appendChild(progressBar);
  document.body.appendChild(progressContainer);
}

/**
 * Update the progress bar width based on scroll position
 * Calculates the percentage of page scrolled and updates bar width
 * Uses passive event listener for optimal scroll performance
 * Attaches listener only once to prevent memory leaks
 */
function updateScrollProgress(): void {
  // Only attach listener once to prevent duplicate listeners
  if (scrollListenerAttached) {
    return;
  }

  const updateBar = (): void => {
    const winScroll =
      document.body.scrollTop || document.documentElement.scrollTop;
    const height =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;

    const myBar = document.getElementById("myBar");
    if (myBar) {
      myBar.style.width = scrolled + "%";
    }
  };

  // Use passive listener for better scroll performance
  // Passive listeners cannot prevent default, but scroll can't be prevented anyway
  document.addEventListener("scroll", updateBar, { passive: true });
  scrollListenerAttached = true;
}

/**
 * Initialize the progress bar feature
 * Safe to call multiple times (re-initialization for page transitions)
 * - Recreates the progress bar element
 * - Attaches scroll listener (only on first call)
 * - Ideal for use with Astro's astro:page-load and astro:after-swap events
 */
export function initProgressBar(): void {
  createProgressBar();
  updateScrollProgress();
}
