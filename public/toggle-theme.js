/**
 * Natspaper Theme Toggle System
 * Remediated to resolve js/function-declaration-conflict
 */

(function () {
  const themeStorageKey = "theme";

  /**
   * 1. GET PREFERENCE
   * Pure logic to determine the active theme.
   */
  const getThemePreference = () => {
    if (typeof localStorage !== "undefined") {
      const savedTheme = localStorage.getItem(themeStorageKey);
      if (savedTheme) return savedTheme;
    }
    return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  /**
   * 2. APPLY THEME (The single source of truth)
   * Replacing the conflicting 'reflectPreference' declarations.
   */
  const applyTheme = (theme) => {
    // WRITE: Set data attribute and class
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");

    // WRITE: Update ARIA label for accessibility
    const themeBtn = document.querySelector("#theme-btn");
    if (themeBtn) {
      const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
      themeBtn.setAttribute("aria-label", label);
    }

    // PERF: Batch meta theme-color update to avoid layout thrashing
    requestAnimationFrame(() => {
      const metaThemeColor = document.querySelector("meta[name='theme-color']");
      if (metaThemeColor) {
        const bgColor = getComputedStyle(document.body).backgroundColor;
        metaThemeColor.setAttribute("content", bgColor || (theme === "dark" ? "#121212" : "#fafafa"));
      }
    });

    // Dispatch event for specialized components (like Giscus)
    document.dispatchEvent(new CustomEvent("theme-changed", { detail: { theme } }));
  };

  /**
   * 3. INITIALIZE & EVENT HANDLERS
   */
  const handleToggle = () => {
    const currentTheme = getThemePreference();
    const newTheme = currentTheme === "light" ? "dark" : "light";
    localStorage.setItem(themeStorageKey, newTheme);
    applyTheme(newTheme);
  };

  const init = () => {
    const theme = getThemePreference();
    applyTheme(theme);

    const themeBtn = document.querySelector("#theme-btn");
    if (themeBtn) {
      // Remove old listeners to prevent memory leaks in SPAs/View Transitions
      themeBtn.removeEventListener("click", handleToggle);
      themeBtn.addEventListener("click", handleToggle);
    }
  };

  // Execution
  init();

  // Support for Astro View Transitions
  document.addEventListener("astro:after-swap", init);
})();
