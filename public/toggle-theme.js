// ============================================================
// FOUC-Free Theme Toggle Script
// ============================================================
// Handles user interactions and theme synchronization.
// The instant theme-setting is handled by the inline script
// in Layout.astro, so this script only needs to handle:
// 1. Button clicks for manual theme switching
// 2. System theme change detection
// 3. Meta theme-color tag updates
// ============================================================

const themeStorageKey = "theme";
const themeBtn = document.querySelector("#theme-btn");

const getThemePreference = () => {
  if (typeof localStorage !== 'undefined' && localStorage.getItem(themeStorageKey)) {
    return localStorage.getItem(themeStorageKey);
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

let currentTheme = getThemePreference();

const setPreference = (theme) => {
  localStorage.setItem(themeStorageKey, theme);
  reflectPreference(theme);
};

const reflectPreference = (theme) => {
  document.documentElement.dataset.theme = theme;
  themeBtn?.setAttribute("aria-label", theme);
  
  // Update the theme-color meta tag
  const metaThemeColor = document.querySelector("meta[name='theme-color']");
  if (metaThemeColor) {
      // requestAnimationFrame ensures this runs after the browser has repainted
      requestAnimationFrame(() => {
        const bodyBgColor = getComputedStyle(document.body).backgroundColor;
        metaThemeColor.setAttribute("content", bodyBgColor);
      });
  }
};

// Set initial preference
reflectPreference(currentTheme);

// Attach event listeners
const setupThemeListeners = () => {
  // Sync with system changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", (e) => {
    const newTheme = e.matches ? "dark" : "light";
    currentTheme = newTheme;
    setPreference(newTheme);
  });

  // Handle button click
  themeBtn?.addEventListener("click", () => {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    setPreference(currentTheme);
  });
};

// Run on initial page load
document.addEventListener("DOMContentLoaded", setupThemeListeners);

// Run on Astro view transitions
document.addEventListener("astro:after-swap", setupThemeListeners);
