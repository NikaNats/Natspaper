// ============================================================
// FOUC-Free Theme Toggle Script
// ============================================================

const themeStorageKey = "theme";

const getThemePreference = () => {
  if (
    typeof localStorage !== "undefined" &&
    localStorage.getItem(themeStorageKey)
  ) {
    return localStorage.getItem(themeStorageKey);
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const reflectPreference = theme => {
  document.documentElement.dataset.theme = theme;

  const themeBtn = document.querySelector("#theme-btn");
  if (themeBtn) {
    themeBtn.setAttribute("aria-label", theme);
  }

  const metaThemeColor = document.querySelector("meta[name='theme-color']");
  if (metaThemeColor) {
    requestAnimationFrame(() => {
      const bodyBgColor = getComputedStyle(document.body).backgroundColor;
      metaThemeColor.setAttribute("content", bodyBgColor);
    });
  }
};

const setPreference = theme => {
  localStorage.setItem(themeStorageKey, theme);
  reflectPreference(theme);
};

const toggleTheme = () => {
  const current =
    document.documentElement.dataset.theme || getThemePreference();
  const next = current === "light" ? "dark" : "light";
  setPreference(next);
};

const syncSystemTheme = e => {
  const newTheme = e.matches ? "dark" : "light";
  setPreference(newTheme);
};

// Initialize listeners
const init = () => {
  const themeBtn = document.querySelector("#theme-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", toggleTheme);
  }

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", syncSystemTheme);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

document.addEventListener("astro:after-swap", init);
