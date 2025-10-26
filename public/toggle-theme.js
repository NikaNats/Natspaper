const primaryColorScheme = ""; // "light" | "dark"

// ============================================================
// Theme Storage Manager
// ============================================================
// Handles theme persistence with graceful fallback for restricted contexts
// (e.g., Claude artifacts, restricted iframes, etc.)
// NEVER use localStorage, sessionStorage directly - always check availability first
// ============================================================

class ThemeStorageManager {
  constructor() {
    // In-memory fallback storage for restricted contexts
    this.memoryStorage = {};
    this.storageAvailable = this.checkStorageAvailability();
  }

  /**
   * Check if localStorage is available and writable
   * Returns false in restricted contexts (artifacts, iframes, etc.)
   */
  checkStorageAvailability() {
    try {
      const test = "__theme_storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      // localStorage is not available (restricted context, quota exceeded, etc.)
      // eslint-disable-next-line no-console
      console.debug("Theme: localStorage unavailable, using in-memory storage");
      return false;
    }
  }

  /**
   * Get theme from storage with fallback to in-memory
   */
  get(key) {
    if (this.storageAvailable) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.debug(
          `Theme: Failed to get from localStorage, using memory: ${e}`
        );
        return this.memoryStorage[key] || null;
      }
    }
    return this.memoryStorage[key] || null;
  }

  /**
   * Set theme in storage with fallback to in-memory
   */
  set(key, value) {
    if (this.storageAvailable) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.debug(`Theme: Failed to set localStorage, using memory: ${e}`);
        this.memoryStorage[key] = value;
      }
    } else {
      this.memoryStorage[key] = value;
    }
  }
}

const themeStorage = new ThemeStorageManager();

// Get theme data from storage (with fallback)
const currentTheme = themeStorage.get("theme");

function getPreferTheme() {
  // return theme value in storage if it is set
  if (currentTheme) return currentTheme;

  // return primary color scheme if it is set
  if (primaryColorScheme) return primaryColorScheme;

  // return user device's prefer color scheme
  return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

let themeValue = getPreferTheme();

function setPreference() {
  themeStorage.set("theme", themeValue);
  reflectPreference();
}

function reflectPreference() {
  document.firstElementChild?.dataset.theme = themeValue;

  document.querySelector("#theme-btn")?.setAttribute("aria-label", themeValue);

  // Get a reference to the body element
  const body = document.body;

  // Check if the body element exists before using getComputedStyle
  if (body) {
    // Get the computed styles for the body element
    const computedStyles = globalThis.getComputedStyle(body);

    // Get the background color property
    const bgColor = computedStyles.backgroundColor;

    // Set the background color in <meta theme-color ... />
    document
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", bgColor);
  }
}

// set early so no page flashes / CSS is made aware
reflectPreference();

window.onload = () => {
  function setThemeFeature() {
    // set on load so screen readers can get the latest value on the button
    reflectPreference();

    // now this script can find and listen for clicks on the control
    document.querySelector("#theme-btn")?.addEventListener("click", () => {
      themeValue = themeValue === "light" ? "dark" : "light";
      setPreference();
    });
  }

  setThemeFeature();

  // Runs on view transitions navigation
  document.addEventListener("astro:after-swap", setThemeFeature);
};

// Set theme-color value before page transition
// to avoid navigation bar color flickering in Android dark mode
document.addEventListener("astro:before-swap", event => {
  const bgColor = document
    .querySelector("meta[name='theme-color']")
    ?.getAttribute("content");

  event.newDocument
    .querySelector("meta[name='theme-color']")
    ?.setAttribute("content", bgColor);
});

// sync with system changes
globalThis
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", ({ matches: isDark }) => {
    themeValue = isDark ? "dark" : "light";
    setPreference();
  });
