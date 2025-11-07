// ============================================================
// Robust, Synchronous Theme Toggle Script
// ============================================================
// This script ensures header and body change theme SYNCHRONOUSLY
// and maintain the same color at all times.
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
const setPreference = (theme) => {
  localStorage.setItem(themeStorageKey, theme);
  applyTheme(theme);
};

// Apply theme to the document SYNCHRONOUSLY
// This ensures header, body, and all elements update at the same time
const applyTheme = (theme) => {
  // 1. Apply theme class to html element IMMEDIATELY (no async)
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");

  // 2. Force a reflow to ensure CSS recalculation happens synchronously
  // This makes the theme apply to header and body at the same moment
  document.documentElement.offsetHeight;

  // 3. Update button aria-label
  const themeBtn = document.querySelector("#theme-btn");
  if (themeBtn) {
    const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    themeBtn.setAttribute("aria-label", label);
  }

  // 4. Update meta theme-color synchronously (no requestAnimationFrame)
  const metaThemeColor = document.querySelector("meta[name='theme-color']");
  if (metaThemeColor) {
    // Use body background for meta theme-color instead
    const bgColor = getComputedStyle(document.body).backgroundColor;
    metaThemeColor.setAttribute("content", bgColor || "#fafafa");
  }

  // 5. Make header and top-nav-wrap fully transparent
  const header = document.querySelector("header");
  if (header) {
    header.style.backgroundColor = "transparent";
  }

  const topNavWrap = document.querySelector("#top-nav-wrap");
  if (topNavWrap) {
    topNavWrap.style.backgroundColor = "transparent";
    topNavWrap.style.borderColor = "transparent";
  }

  // 5. Dispatch custom event so other components know theme changed
  document.dispatchEvent(
    new CustomEvent("theme-changed", { detail: { theme } })
  );
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

  // Remove any existing listeners to prevent duplicates
  const newBtn = themeBtn.cloneNode(true);
  themeBtn.parentNode?.replaceChild(newBtn, themeBtn);

  const updatedBtn = document.querySelector("#theme-btn");
  if (updatedBtn) {
    updatedBtn.addEventListener("click", () => {
      const currentTheme = getThemePreference();
      const newTheme = currentTheme === "light" ? "dark" : "light";
      setPreference(newTheme);
    });
  }
};

// Listen for system theme changes
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
const handleSystemThemeChange = (e) => {
  // Only apply if user hasn't set a preference
  if (!localStorage.getItem(themeStorageKey)) {
    const newTheme = e.matches ? "dark" : "light";
    setPreference(newTheme);
  }
};
mediaQuery.addEventListener("change", handleSystemThemeChange);

// --- EXECUTION ---
// Restore theme immediately
restoreTheme();

// Attach toggle listener on initial load
attachToggleListener();

// Listen for Astro View Transition events
document.addEventListener("astro:transition:start", restoreTheme);
document.addEventListener("astro:before-swap", restoreTheme);
document.addEventListener("astro:after-swap", () => {
  attachToggleListener();
  restoreTheme();
});

// Also listen for Astro router events (newer versions)
document.addEventListener("astro:before-preparation", restoreTheme);
document.addEventListener("astro:after-preparation", () => {
  attachToggleListener();
  restoreTheme();
});