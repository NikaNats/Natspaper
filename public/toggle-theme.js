// ============================================================
// Robust, Synchronous Theme Toggle Script
// Optimized to eliminate Forced Reflows (Lighthouse fix)
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
  return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

// Save theme preference and apply it
const setPreference = theme => {
  localStorage.setItem(themeStorageKey, theme);
  applyTheme(theme);
};

// Apply theme to the document
// Optimized to eliminate forced reflows and layout thrashing
const applyTheme = theme => {
  // 1. WRITE: Apply theme class immediately
  // This is a visual update and should happen synchronously
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");

  // PERF FIX: Removed "void document.documentElement.offsetHeight;"
  // This line was explicitly forcing a layout recalculation (reflow),
  // causing the performance penalty flagged by Lighthouse.

  // 2. WRITE: Update button state
  const themeBtn = document.querySelector("#theme-btn");
  if (themeBtn) {
    const label =
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    themeBtn.setAttribute("aria-label", label);
  }

  // 3. WRITE: Reset styles
  const header = document.querySelector("header");
  if (header) header.style.backgroundColor = "transparent";

  const topNavWrap = document.querySelector("#top-nav-wrap");
  if (topNavWrap) {
    topNavWrap.style.backgroundColor = "transparent";
    topNavWrap.style.borderColor = "transparent";
  }

  // 4. READ & WRITE: Update meta theme-color
  // PERF FIX: Wrapped in requestAnimationFrame
  // Reading getComputedStyle immediately after changing classes forces the browser
  // to recalculate styles synchronously (Layout Thrashing).
  // By moving this to the next frame, we let the browser batch the layout work.
  requestAnimationFrame(() => {
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) {
      // Now it's safe to read the computed style because the browser has likely
      // finished the previous paint task.
      const bgColor = getComputedStyle(document.body).backgroundColor;
      metaThemeColor.setAttribute("content", bgColor || "#fafafa");
    }
  });

  // 5. Dispatch event
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
const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
const handleSystemThemeChange = e => {
  // Only apply if user hasn't set a preference
  if (!localStorage.getItem(themeStorageKey)) {
    const newTheme = e.matches ? "dark" : "light";
    setPreference(newTheme);
  }
};
mediaQuery.addEventListener("change", handleSystemThemeChange);

// --- EXECUTION ---
restoreTheme();
attachToggleListener();

document.addEventListener("astro:transition:start", restoreTheme);
document.addEventListener("astro:before-swap", restoreTheme);
document.addEventListener("astro:after-swap", () => {
  attachToggleListener();
  restoreTheme();
});
document.addEventListener("astro:before-preparation", restoreTheme);
document.addEventListener("astro:after-preparation", () => {
  attachToggleListener();
  restoreTheme();
});
