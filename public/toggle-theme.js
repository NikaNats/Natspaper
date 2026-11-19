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

  const systemQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");

  const getThemePreference = () => {
    const savedTheme = readSaved();
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
    return systemQuery.matches ? "dark" : "light";
  };

  /**
   * 2. APPLY THEME (The single source of truth)
   * Replacing the conflicting 'reflectPreference' declarations.
   */
  // theme-color values: MUST match the pair in ThemeManager.astro's inline
  // script. That script runs before <body> exists and before CSS loads, so it
  // cannot read computed styles; both places use these constants so first
  // paint and toggle agree.
  const themeColors = { dark: "#141517", light: "#fafafa" };

  const isPinned = () => {
    const saved = readSaved();
    return saved === "dark" || saved === "light";
  };

  // `pinned` = the user has an explicit override. When false the meta goes
  // back to "light dark" (follow system); data-theme / inline color-scheme
  // still carry the resolved theme.
  const applyTheme = (theme, pinned = isPinned()) => {
    // WRITE: every theme signal ThemeManager sets at first paint. The inline
    // color-scheme style must be updated too: it outranks the stylesheet's
    // html[data-theme] rule, so leaving it stale kept native scrollbars and
    // form controls in the old scheme until a full reload.
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;

    // WRITE: keep <meta name="color-scheme"> in sync (same as ThemeManager's
    // inline script). Re-run after astro:after-swap, which resets the head meta.
    const schemeMeta = document.querySelector('meta[name="color-scheme"]');
    if (schemeMeta) {
      schemeMeta.setAttribute("content", pinned ? theme : "light dark");
    }

    // WRITE: Update ARIA label for accessibility
    const themeBtn = document.querySelector("#theme-btn");
    if (themeBtn) {
      const label =
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
      themeBtn.setAttribute("aria-label", label);
    }

    // WRITE: address-bar colour; same constants as the first-paint script.
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor)
      metaThemeColor.setAttribute("content", themeColors[theme]);

    // Dispatch event for specialized components (like Giscus)
    document.dispatchEvent(
      new CustomEvent("theme-changed", { detail: { theme } })
    );
  };

  /**
   * 3. INITIALIZE & EVENT HANDLERS
   */
  // Two-state toggle that can always return to "follow system":
  //   target = opposite of the theme currently RENDERED (read from the DOM so
  //   it is right even when storage is unavailable).
  //   target differs from the OS preference -> store it literally (pinned).
  //   target equals the OS preference       -> remove the stored value
  //   (back to system; meta becomes "light dark").
  // The OS comparison happens here, at toggle time only. The matchMedia
  // handler below never removes a stored value.
  const handleToggle = () => {
    const rendered =
      document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const target = rendered === "dark" ? "light" : "dark";
    const systemTheme = systemQuery.matches ? "dark" : "light";
    const pinned = target !== systemTheme;
    try {
      if (pinned) localStorage.setItem(themeStorageKey, target);
      else localStorage.removeItem(themeStorageKey);
    } catch {
      // Not persisted (storage unavailable); still apply for this page.
    }
    applyTheme(target, pinned);
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

  // Registered once, outside init(): init() re-runs on every astro:after-swap
  // and would stack duplicate listeners.

  // Follow OS scheme changes (e.g. automatic day/night switching), but only
  // while the user has no saved override. A saved value is never cleared here,
  // even when it happens to match the OS, so a pinned theme stays pinned.
  systemQuery.addEventListener("change", () => {
    if (isPinned()) return;
    applyTheme(getThemePreference(), false);
  });

  // Cross-tab sync: "storage" fires only in *other* tabs. key === null means
  // storage was cleared. Re-resolve from storage (or the OS when removed).
  window.addEventListener("storage", event => {
    if (event.key !== null && event.key !== themeStorageKey) return;
    applyTheme(getThemePreference());
  });

  // Support for Astro View Transitions
  document.addEventListener("astro:after-swap", init);
})();
