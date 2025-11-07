// ============================================================
// Unified Theme Toggle Script
// ============================================================
// Single source of truth for theme management.
// Uses data-theme attribute on html element for consistency.
// Works synchronously to prevent header/body mismatch.
// ============================================================

const THEME_KEY = "theme";

/**
 * Get the current theme preference
 * Priority: saved theme > system preference > light (default)
 */
const getThemePreference = () => {
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

/**
 * Apply theme synchronously to prevent FOUC and header/body mismatch
 * Updates:
 * - data-theme attribute (for CSS theming)
 * - dark class (for Tailwind compatibility)
 * - button aria-label
 * - meta theme-color
 */
const applyTheme = theme => {
  // Apply to document element synchronously
  document.documentElement.dataset.theme = theme;

  // Also apply dark class for Tailwind CSS support
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  // Update theme button aria-label
  const themeBtn = document.querySelector("#theme-btn");
  if (themeBtn) {
    themeBtn.setAttribute("aria-label", theme);
  }

  // Update meta theme-color for browser UI
  const metaThemeColor = document.querySelector("meta[name='theme-color']");
  if (metaThemeColor) {
    requestAnimationFrame(() => {
      const bgColor = getComputedStyle(document.body).backgroundColor;
      metaThemeColor.setAttribute("content", bgColor);
    });
  }
};

/**
 * Save theme preference to localStorage and apply it
 */
const setTheme = theme => {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
};

/**
 * Attach click listener to theme toggle button
 */
const attachToggleListener = () => {
  const themeBtn = document.querySelector("#theme-btn");
  if (!themeBtn) return;

  // Remove any existing listeners by replacing the element
  const newBtn = themeBtn.cloneNode(true);
  themeBtn.parentNode.replaceChild(newBtn, themeBtn);

  newBtn.addEventListener("click", () => {
    const current = getThemePreference();
    const next = current === "light" ? "dark" : "light";
    setTheme(next);
  });
};

/**
 * Listen for system-level theme preference changes
 */
const listenSystemChanges = () => {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", e => {
      // Only apply if no user preference is saved
      if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(e.matches ? "dark" : "light");
      }
    });
};

// --- INITIALIZATION ---
// Apply theme immediately on load
applyTheme(getThemePreference());

// Attach toggle listener
attachToggleListener();

// Listen for system changes
listenSystemChanges();

// --- VIEW TRANSITIONS SUPPORT ---
// Ensure theme persists and button listener is reattached after navigation
document.addEventListener("astro:after-swap", () => {
  applyTheme(getThemePreference());
  attachToggleListener();
});
