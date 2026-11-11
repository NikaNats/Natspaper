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
  // localStorage throws (not just returns null) in sandboxed iframes and some
  // strict privacy modes; every access is guarded so the toggle still works
  // for the current page.
  const readSaved = () => {
    try {
      return localStorage.getItem(themeStorageKey);
    } catch {
      return null;
    }
  };

  const getThemePreference = () => {
    const savedTheme = readSaved();
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
    return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  /**
   * 2. APPLY THEME (The single source of truth)
   * Replacing the conflicting 'reflectPreference' declarations.
   */
  const applyTheme = theme => {
    // WRITE: every theme signal ThemeManager sets at first paint. The inline
    // color-scheme style must be updated too: it outranks the stylesheet's
    // html[data-theme] rule, so leaving it stale kept native scrollbars and
    // form controls in the old scheme until a full reload.
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;

    // WRITE: Update ARIA label for accessibility
    const themeBtn = document.querySelector("#theme-btn");
    if (themeBtn) {
      const label =
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
      themeBtn.setAttribute("aria-label", label);
    }

    // PERF: Batch meta theme-color update to avoid layout thrashing
    requestAnimationFrame(() => {
      const metaThemeColor = document.querySelector("meta[name='theme-color']");
      if (metaThemeColor) {
        const bgColor = getComputedStyle(document.body).backgroundColor;
        metaThemeColor.setAttribute(
          "content",
          bgColor || (theme === "dark" ? "#141517" : "#fafafa")
        );
      }
    });

    // Dispatch event for specialized components (like Giscus)
    document.dispatchEvent(
      new CustomEvent("theme-changed", { detail: { theme } })
    );
  };

  /**
   * 3. INITIALIZE & EVENT HANDLERS
   */
  const handleToggle = () => {
    const currentTheme = getThemePreference();
    const newTheme = currentTheme === "light" ? "dark" : "light";
    try {
      localStorage.setItem(themeStorageKey, newTheme);
    } catch {
      // Not persisted (storage unavailable); still apply for this page.
    }
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
