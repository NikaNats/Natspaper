/**
 * Unit Tests for public/toggle-theme.js
 *
 * The script is a classic (non-module) IIFE served from /public, so it is
 * evaluated against the happy-dom globals with a controllable matchMedia and
 * an in-memory localStorage. Each test loads a fresh copy and removes the
 * document/window listeners it registered.
 *
 * Tests cover:
 * - handleToggle: two-state toggle that can always return to "follow system"
 * - <meta name="color-scheme"> / theme-color kept in sync with the theme
 * - matchMedia "change": follows the OS only while nothing is saved, and
 *   never removes or rewrites a saved value
 * - cross-tab "storage" events and astro:after-swap re-application
 * - localStorage that throws (sandboxed iframes, blocked site data)
 *
 * @module tests/unit/ui/toggle-theme.test
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SOURCE = readFileSync(
  path.resolve(import.meta.dirname, "../../../public/toggle-theme.js"),
  "utf8"
);

type Theme = "light" | "dark";

interface MemoryStorage {
  data: Map<string, string>;
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
}

function createStorage(
  initial: Theme | null,
  { throws = false }: { throws?: boolean } = {}
): MemoryStorage {
  const data = new Map<string, string>();
  if (initial) data.set("theme", initial);
  return {
    data,
    getItem: vi.fn((key: string) => {
      if (throws) throw new DOMException("denied", "SecurityError");
      return data.get(key) ?? null;
    }),
    setItem: vi.fn((key: string, value: string) => {
      if (throws) throw new DOMException("denied", "SecurityError");
      data.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      if (throws) throw new DOMException("denied", "SecurityError");
      data.delete(key);
    }),
  };
}

function createMatchMedia(initialDark: boolean) {
  let dark = initialDark;
  const listeners = new Set<() => void>();
  const mql = {
    get matches() {
      return dark;
    },
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_type: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_type: string, cb: () => void) =>
      listeners.delete(cb),
  };
  return {
    mql,
    setDark(next: boolean) {
      dark = next;
      listeners.forEach(cb => cb());
    },
  };
}

const registered: Array<[EventTarget, string, EventListenerOrEventListenerObject]> =
  [];

function trackListeners() {
  for (const target of [document, window] as EventTarget[]) {
    const original = target.addEventListener.bind(target);
    vi.spyOn(target, "addEventListener").mockImplementation(
      (type: string, listener: unknown, options?: unknown) => {
        registered.push([
          target,
          type,
          listener as EventListenerOrEventListenerObject,
        ]);
        original(
          type,
          listener as EventListenerOrEventListenerObject,
          options as AddEventListenerOptions
        );
      }
    );
  }
}

interface Env {
  storage: MemoryStorage;
  media: ReturnType<typeof createMatchMedia>;
}

function load({
  os,
  stored,
  storageThrows = false,
}: {
  os: Theme;
  stored: Theme | null;
  storageThrows?: boolean;
}): Env {
  const storage = createStorage(stored, { throws: storageThrows });
  const media = createMatchMedia(os === "dark");
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("matchMedia", () => media.mql);

  document.head.innerHTML =
    '<meta name="color-scheme" content="light dark">' +
    '<meta name="theme-color" content="#141517">';
  document.body.innerHTML = '<button id="theme-btn"></button>';

  vm.runInThisContext(SOURCE);
  return { storage, media };
}

const root = () => document.documentElement;
const schemeMeta = () =>
  document
    .querySelector('meta[name="color-scheme"]')
    ?.getAttribute("content");
const themeColor = () =>
  document.querySelector('meta[name="theme-color"]')?.getAttribute("content");
const clickToggle = () =>
  (document.querySelector("#theme-btn") as HTMLButtonElement).click();
const storageEvent = (key: string | null) =>
  window.dispatchEvent(Object.assign(new Event("storage"), { key }));

beforeEach(() => {
  root().removeAttribute("data-theme");
  root().removeAttribute("style");
  root().className = "";
  trackListeners();
});

afterEach(() => {
  for (const [target, type, listener] of registered.splice(0)) {
    target.removeEventListener(type, listener);
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("handleToggle", () => {
  it('no stored value + OS light -> stores "dark" and pins the meta to "dark"', () => {
    const { storage } = load({ os: "light", stored: null });
    expect(root().dataset.theme).toBe("light");
    expect(schemeMeta()).toBe("light dark");

    clickToggle();

    expect(storage.setItem).toHaveBeenCalledWith("theme", "dark");
    expect(storage.data.get("theme")).toBe("dark");
    expect(root().dataset.theme).toBe("dark");
    expect(root().style.colorScheme).toBe("dark");
    expect(schemeMeta()).toBe("dark");
  });

  it('stored "dark" + OS light -> removes the stored value and resets the meta to "light dark"', () => {
    const { storage } = load({ os: "light", stored: "dark" });
    expect(root().dataset.theme).toBe("dark");
    expect(schemeMeta()).toBe("dark");

    clickToggle();

    expect(storage.removeItem).toHaveBeenCalledWith("theme");
    expect(storage.data.has("theme")).toBe(false);
    expect(root().dataset.theme).toBe("light");
    expect(schemeMeta()).toBe("light dark");
  });

  it('stored "dark" + OS dark -> target "light" differs from the OS, so it is stored literally and never removed', () => {
    // Rendered theme is dark, so the toggle targets light. Light differs from
    // the OS (dark): pin it. Removing would leave the page dark, i.e. no
    // visible effect from the click.
    const { storage } = load({ os: "dark", stored: "dark" });
    expect(root().dataset.theme).toBe("dark");

    clickToggle();

    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(storage.data.get("theme")).toBe("light");
    expect(root().dataset.theme).toBe("light");
    expect(schemeMeta()).toBe("light");
  });

  it("toggling twice from a clean state returns to follow-system", () => {
    const { storage } = load({ os: "light", stored: null });

    clickToggle();
    expect(storage.data.get("theme")).toBe("dark");

    clickToggle();
    expect(storage.data.has("theme")).toBe(false);
    expect(root().dataset.theme).toBe("light");
    expect(schemeMeta()).toBe("light dark");
  });

  it("theme still applies and nothing throws when localStorage throws", () => {
    load({ os: "light", stored: null, storageThrows: true });
    expect(root().dataset.theme).toBe("light");

    expect(() => clickToggle()).not.toThrow();
    expect(root().dataset.theme).toBe("dark");
    expect(root().style.colorScheme).toBe("dark");
    expect(schemeMeta()).toBe("dark");

    // Reverting is computed from the rendered theme, not from storage.
    expect(() => clickToggle()).not.toThrow();
    expect(root().dataset.theme).toBe("light");
    expect(schemeMeta()).toBe("light dark");
  });

  it("writes the same theme-color constants the inline first-paint script uses (never a computed rgba)", () => {
    load({ os: "light", stored: null });
    expect(themeColor()).toBe("#fafafa");

    clickToggle();
    expect(themeColor()).toBe("#141517");

    clickToggle();
    expect(themeColor()).toBe("#fafafa");
    expect(themeColor()).not.toMatch(/rgba?\(/);
  });

  it("dispatches theme-changed with the new theme", () => {
    load({ os: "light", stored: null });
    const seen: string[] = [];
    document.addEventListener("theme-changed", e =>
      seen.push((e as CustomEvent<{ theme: string }>).detail.theme)
    );

    clickToggle();
    expect(seen).toEqual(["dark"]);
  });
});

describe("matchMedia change handler", () => {
  it('with nothing saved: follows the OS, keeps the meta at "light dark", writes nothing', () => {
    const { storage, media } = load({ os: "light", stored: null });

    media.setDark(true);

    expect(root().dataset.theme).toBe("dark");
    expect(schemeMeta()).toBe("light dark");
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('with "dark" saved and the OS changing to dark: stays pinned and the saved value is kept', () => {
    const { storage, media } = load({ os: "light", stored: "dark" });

    media.setDark(true); // OS now matches the saved value
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(storage.data.get("theme")).toBe("dark");
    expect(root().dataset.theme).toBe("dark");
    expect(schemeMeta()).toBe("dark");

    media.setDark(false); // ...and back: still pinned
    expect(storage.data.get("theme")).toBe("dark");
    expect(root().dataset.theme).toBe("dark");
  });

  it('with "light" saved: OS flips never change the theme', () => {
    const { storage, media } = load({ os: "dark", stored: "light" });

    media.setDark(false);
    media.setDark(true);

    expect(root().dataset.theme).toBe("light");
    expect(storage.data.get("theme")).toBe("light");
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });
});

describe("cross-tab storage event", () => {
  it("ignores unrelated keys", () => {
    const { storage } = load({ os: "light", stored: null });
    storage.data.set("other", "x");
    storage.data.set("theme", "dark"); // would apply if the handler reacted

    storageEvent("other");
    expect(root().dataset.theme).toBe("light");
  });

  it("applies a theme saved by another tab", () => {
    const { storage } = load({ os: "light", stored: null });

    storage.data.set("theme", "dark");
    storageEvent("theme");

    expect(root().dataset.theme).toBe("dark");
    expect(schemeMeta()).toBe("dark");
  });

  it('falls back to the OS and "light dark" when another tab removed the value', () => {
    const { storage } = load({ os: "light", stored: "dark" });
    expect(root().dataset.theme).toBe("dark");

    storage.data.delete("theme");
    storageEvent("theme");

    expect(root().dataset.theme).toBe("light");
    expect(schemeMeta()).toBe("light dark");
  });

  it("re-resolves when storage is cleared (key === null)", () => {
    const { storage } = load({ os: "dark", stored: "light" });
    expect(root().dataset.theme).toBe("light");

    storage.data.clear();
    storageEvent(null);

    expect(root().dataset.theme).toBe("dark");
    expect(schemeMeta()).toBe("light dark");
  });
});

describe("astro:after-swap (ClientRouter)", () => {
  it("re-applies the pinned theme after the swap resets html attributes and the head meta", () => {
    load({ os: "light", stored: "dark" });
    expect(schemeMeta()).toBe("dark");

    // What a ClientRouter swap does: new document's root attributes and head.
    root().removeAttribute("data-theme");
    root().removeAttribute("style");
    root().className = "";
    document.head.innerHTML =
      '<meta name="color-scheme" content="light dark">' +
      '<meta name="theme-color" content="#141517">';
    document.body.innerHTML = '<button id="theme-btn"></button>';

    document.dispatchEvent(new Event("astro:after-swap"));

    expect(root().dataset.theme).toBe("dark");
    expect(root().style.colorScheme).toBe("dark");
    expect(schemeMeta()).toBe("dark");
    expect(themeColor()).toBe("#141517");
  });

  it('keeps "light dark" after a swap when nothing is saved', () => {
    load({ os: "dark", stored: null });

    document.head.innerHTML =
      '<meta name="color-scheme" content="light dark">' +
      '<meta name="theme-color" content="#141517">';
    document.dispatchEvent(new Event("astro:after-swap"));

    expect(root().dataset.theme).toBe("dark");
    expect(schemeMeta()).toBe("light dark");
  });

  it("re-binds the toggle button to the swapped-in DOM", () => {
    const { storage } = load({ os: "light", stored: null });

    document.body.innerHTML = '<button id="theme-btn"></button>';
    document.dispatchEvent(new Event("astro:after-swap"));
    clickToggle();

    expect(storage.data.get("theme")).toBe("dark");
  });
});
