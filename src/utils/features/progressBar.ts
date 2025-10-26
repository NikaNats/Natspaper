/**
 * Progress Bar Feature
 * Creates and manages a scroll progress indicator at the top of the page
 *
 * Usage in Astro components:
 * import { initProgressBar } from "@/utils/features/progressBar";
 * export const prerender = false; // Make component hydrated
 * Then call initProgressBar() in a client script
 */

export function initProgressBar(): void {
  createProgressBar();
  updateScrollProgress();
}

function createProgressBar(): void {
  const progressContainer = document.createElement("div");
  progressContainer.className =
    "progress-container fixed top-0 z-10 h-1 w-full bg-background";

  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar h-1 w-0 bg-accent";
  progressBar.id = "myBar";

  progressContainer.appendChild(progressBar);
  document.body.appendChild(progressContainer);
}

function updateScrollProgress(): void {
  document.addEventListener("scroll", () => {
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
  });
}
