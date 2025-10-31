// ============================================================
// Robust, View-Transition-Aware Theme Toggle Script
// ============================================================
// This script handles user interactions and system theme changes,
// ensuring functionality persists across Astro View Transitions.
// ============================================================

const themeStorageKey = "theme";

// Helper functions
const getThemePreference = () => {
  if (typeof localStorage !== "undefined" && localStorage.getItem(themeStorageKey)) {
    return localStorage.getItem(themeStorageKey);
  }
  return window.initialTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
};

const setPreference = (theme) => {
  localStorage.setItem(themeStorageKey, theme);
  reflectPreference(theme);
};

const reflectPreference = (theme) => {
  document.documentElement.dataset.theme = theme;
  const themeBtn = document.querySelector("#theme-btn");
  themeBtn?.setAttribute("aria-label", theme);

  const metaThemeColor = document.querySelector("meta[name='theme-color']");
  if (metaThemeColor) {
    requestAnimationFrame(() => {
      const bodyBgColor = getComputedStyle(document.body).backgroundColor;
      metaThemeColor.setAttribute("content", bodyBgColor);
    });
  }
};

// --- ONE-TIME SETUP: System Theme Listener ---
// This listener is not tied to a DOM element and should only be attached once.
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
mediaQuery.addEventListener("change", (e) => {
  const newTheme = e.matches ? "dark" : "light";
  setPreference(newTheme);
});

// --- REPEATED SETUP: Button Click Listener ---
// This function finds the button and attaches the click listener.
// It needs to run on initial load and after every page transition.
const attachToggleListener = () => {
  const themeBtn = document.querySelector("#theme-btn");
  if (!themeBtn) return; // Exit if the button isn't on the page

  themeBtn.addEventListener("click", () => {
    const currentTheme = getThemePreference();
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setPreference(newTheme);
  });
};

// --- EXECUTION ---
// 1. Run on initial page load
attachToggleListener();

// 2. Re-run after every Astro View Transition
document.addEventListener("astro:after-swap", attachToggleListener);
