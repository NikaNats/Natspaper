// ============================================================
// Robust, View-Transition-Aware Theme Toggle Script
// ============================================================
// This script handles user interactions and system theme changes,
// ensuring functionality persists across Astro View Transitions.
// ============================================================

const themeStorageKey = "theme";

// Get the current theme preference, checking localStorage first
const getThemePreference = () => {
  if (typeof localStorage !== "undefined") {
    const savedTheme = localStorage.getItem(themeStorageKey);
    if (savedTheme) {
      return savedTheme;
    }
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

// Save theme preference and apply it
const setPreference = theme => {
  localStorage.setItem(themeStorageKey, theme);
  applyTheme(theme);
};

// Apply theme to the document immediately
const applyTheme = theme => {
  // Force synchronous application to prevent FOUC
  document.documentElement.dataset.theme = theme;
  
  // Update button aria-label
  const themeBtn = document.querySelector("#theme-btn");
  if (themeBtn) {
    themeBtn.setAttribute("aria-label", theme);
  }

  // Update meta theme-color
  const metaThemeColor = document.querySelector("meta[name='theme-color']");
  if (metaThemeColor) {
    requestAnimationFrame(() => {
      const bodyBgColor = getComputedStyle(document.body).backgroundColor;
      metaThemeColor.setAttribute("content", bodyBgColor);
    });
  }
};

// Restore and apply saved theme
const restoreTheme = () => {
  const theme = getThemePreference();
  applyTheme(theme);
};

// Attach click listener to theme toggle button
const attachToggleListener = () => {
  const themeBtn = document.querySelector("#theme-btn");
  if (!themeBtn) return;

  themeBtn.addEventListener("click", () => {
    const currentTheme = getThemePreference();
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setPreference(newTheme);
  });
};

// Listen for system theme changes
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
mediaQuery.addEventListener("change", e => {
  const newTheme = e.matches ? "dark" : "light";
  setPreference(newTheme);
});

// --- EXECUTION ---
// Restore theme immediately
restoreTheme();

// Attach toggle listener on initial load
attachToggleListener();

// Listen for Astro View Transition events to maintain theme across navigation
// These events fire when navigating between pages
document.addEventListener("astro:transition:start", restoreTheme);
document.addEventListener("astro:before-swap", restoreTheme);
document.addEventListener("astro:after-swap", () => {
  attachToggleListener();
  // Ensure theme is still applied after swap completes
  restoreTheme();
});
