import { test, expect, type Page } from "@playwright/test";

/**
 * Dark Mode Toggle E2E Tests
 *
 * Critical Flow: Theme switching and persistence
 *
 * Tests verify:
 * - Theme toggle button exists and is accessible
 * - Clicking toggle changes theme (html[data-theme])
 * - Theme persists across page reloads (localStorage)
 * - Theme persists across navigation (View Transitions)
 * - System preference is respected when no saved preference
 */

async function ensureMenuOpen(page: Page) {
  const menuBtn = page.locator("#menu-btn");
  if (await menuBtn.isVisible()) {
    const menuOverlay = page.locator("#mobile-menu-overlay");
    const state = await menuOverlay.getAttribute("data-state");
    if (state !== "open") {
      await menuBtn.click();
      await page.waitForSelector('#mobile-menu-overlay[data-state="open"]');
    }
  }
}

test.describe("Dark Mode Toggle", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any saved theme preference before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("theme"));
    await page.reload();
    await page.waitForLoadState("networkidle");
    await ensureMenuOpen(page);
  });

  test("should have theme toggle button with proper accessibility", async ({
    page,
  }) => {
    await ensureMenuOpen(page);
    const themeBtn = page.locator('[data-testid="theme-toggle"]');

    // Button should exist and be visible
    await expect(themeBtn).toBeVisible();

    // Should have accessible label
    await expect(themeBtn).toHaveAttribute("aria-label", /toggle|theme/i);

    // Should have title for tooltip
    await expect(themeBtn).toHaveAttribute("title", /theme/i);
  });

  test("should toggle theme from light to dark", async ({ page }) => {
    await ensureMenuOpen(page);
    const themeBtn = page.locator('[data-testid="theme-toggle"]');
    const html = page.locator("html");

    // Get initial theme
    const initialTheme = await html.getAttribute("data-theme");

    // Click toggle
    await themeBtn.click();

    // Wait for theme change
    await page.waitForTimeout(100);

    // Theme should have changed
    const newTheme = await html.getAttribute("data-theme");
    expect(newTheme).not.toBe(initialTheme);

    // Theme should be valid (light or dark)
    expect(newTheme).toMatch(/^(light|dark)$/);
  });

  test("should toggle theme from dark to light", async ({ page }) => {
    const themeBtn = page.locator('[data-testid="theme-toggle"]');
    const html = page.locator("html");

    // Set dark mode first
    await page.evaluate(() => {
      localStorage.setItem("theme", "dark");
      document.documentElement.dataset.theme = "dark";
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    await ensureMenuOpen(page);

    // Verify dark mode
    await expect(html).toHaveAttribute("data-theme", "dark");

    // Click toggle
    await themeBtn.click();
    await page.waitForTimeout(100);

    // Should now be light
    await expect(html).toHaveAttribute("data-theme", "light");
  });

  test("should persist theme preference across page reload", async ({
    page,
  }) => {
    await ensureMenuOpen(page);
    const themeBtn = page.locator('[data-testid="theme-toggle"]');
    const html = page.locator("html");

    // Get initial theme and toggle
    const initialTheme = await html.getAttribute("data-theme");
    await themeBtn.click();
    await page.waitForTimeout(100);

    // Get new theme
    const newTheme = await html.getAttribute("data-theme");
    expect(newTheme).not.toBe(initialTheme);

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Theme should persist
    await expect(html).toHaveAttribute("data-theme", newTheme!);

    // localStorage should have the theme
    const storedTheme = await page.evaluate(() =>
      localStorage.getItem("theme")
    );
    expect(storedTheme).toBe(newTheme);
  });

  test("should persist theme across navigation", async ({ page }) => {
    await ensureMenuOpen(page);
    const themeBtn = page.locator('[data-testid="theme-toggle"]');
    const html = page.locator("html");

    // Set to dark mode
    await themeBtn.click();
    await page.waitForTimeout(100);
    const expectedTheme = await html.getAttribute("data-theme");

    // Navigate to another page
    await page.goto("/en/posts");
    await page.waitForLoadState("networkidle");

    // Theme should persist
    await expect(html).toHaveAttribute("data-theme", expectedTheme!);

    // Navigate back
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    // Theme should still persist
    await expect(html).toHaveAttribute("data-theme", expectedTheme!);
  });

  test("should update html class for dark mode styling", async ({ page }) => {
    const html = page.locator("html");

    // Set dark mode
    await page.evaluate(() => {
      localStorage.setItem("theme", "dark");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    await ensureMenuOpen(page);
    const themeBtn = page.locator('[data-testid="theme-toggle"]');

    // html should have dark class
    await expect(html).toHaveClass(/dark/);

    // Toggle to light
    await themeBtn.click();
    await page.waitForTimeout(100);

    // dark class should be removed
    const hasClass = await html.evaluate(el => el.classList.contains("dark"));
    expect(hasClass).toBe(false);
  });

  test("should show correct icon based on theme", async ({ page }) => {
    await ensureMenuOpen(page);
    const themeBtn = page.locator('[data-testid="theme-toggle"]');

    // Check that the button contains SVG icons
    const hasSvg = await themeBtn.locator("svg").count();
    expect(hasSvg).toBeGreaterThan(0);
  });

  test("should not cause Flash of Unstyled Content (FOUC)", async ({
    page,
  }) => {
    // Set a known theme
    await page.evaluate(() => localStorage.setItem("theme", "dark"));

    // Navigate to a new page
    await page.goto("/en/posts");

    // Immediately check the theme attribute (should be set before first paint)
    const theme = await page.evaluate(
      () => document.documentElement.dataset.theme
    );
    expect(theme).toBe("dark");
  });
});

test.describe("Dark Mode - System Preference", () => {
  test("should respect system dark mode preference when no saved preference", async ({
    page,
  }) => {
    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: "dark" });

    // Navigate first so localStorage operations run against the correct origin
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    // Clear any saved preference, then reload so the FOUC script re-reads media
    await page.evaluate(() => localStorage.removeItem("theme"));
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should detect system preference
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "dark");
  });

  test("should respect system light mode preference when no saved preference", async ({
    page,
  }) => {
    // Emulate light color scheme
    await page.emulateMedia({ colorScheme: "light" });

    // Navigate first so localStorage operations run against the correct origin
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    // Clear any saved preference, then reload so the FOUC script re-reads media
    await page.evaluate(() => localStorage.removeItem("theme"));
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should detect system preference
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "light");
  });

  test("should prefer saved preference over system preference", async ({
    page,
  }) => {
    // Emulate dark system preference
    await page.emulateMedia({ colorScheme: "dark" });

    // Navigate first so localStorage operations run against the correct origin
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    // Override saved preference to light, then reload so the FOUC script picks it up
    await page.evaluate(() => localStorage.setItem("theme", "light"));
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should use saved preference, not system
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "light");
  });
});

/**
 * Follow-system behaviour
 *
 * The toggle is two-state but must always be able to return to "follow
 * system": toggling to a theme that equals the OS preference removes the saved
 * value and resets <meta name="color-scheme"> to "light dark". A saved value
 * (pinned theme) is never removed or rewritten by an OS change.
 */
type Scheme = "light" | "dark";

const savedTheme = (page: Page) =>
  page.evaluate(() => localStorage.getItem("theme"));

const schemeMeta = (page: Page) =>
  page.evaluate(
    () =>
      document
        .querySelector('meta[name="color-scheme"]')
        ?.getAttribute("content") ?? null
  );

async function openClean(page: Page, colorScheme: Scheme) {
  await page.emulateMedia({ colorScheme });
  await page.goto("/en/");
  await page.evaluate(() => localStorage.removeItem("theme"));
  await page.reload();
  await page.waitForLoadState("networkidle");
}

async function clickToggle(page: Page) {
  await ensureMenuOpen(page);
  await page.locator('[data-testid="theme-toggle"]').click();
}

test.describe("Dark Mode - Follow System", () => {
  test("toggling twice returns to follow-system", async ({ page }) => {
    await openClean(page, "light");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "light");
    expect(await schemeMeta(page)).toBe("light dark");

    await clickToggle(page);
    await expect(html).toHaveAttribute("data-theme", "dark");
    expect(await savedTheme(page)).toBe("dark");
    expect(await schemeMeta(page)).toBe("dark");

    await clickToggle(page);
    await expect(html).toHaveAttribute("data-theme", "light");
    expect(await savedTheme(page)).toBeNull();
    expect(await schemeMeta(page)).toBe("light dark");

    // Back on "follow system": the OS must drive the theme again.
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(html).toHaveAttribute("data-theme", "dark");
  });

  test("OS colorScheme change with no saved value: theme follows", async ({
    page,
  }) => {
    await openClean(page, "light");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "light");

    await page.emulateMedia({ colorScheme: "dark" });
    await expect(html).toHaveAttribute("data-theme", "dark");
    expect(await savedTheme(page)).toBeNull();
    expect(await schemeMeta(page)).toBe("light dark");

    await page.emulateMedia({ colorScheme: "light" });
    await expect(html).toHaveAttribute("data-theme", "light");
    expect(await savedTheme(page)).toBeNull();
  });

  test("OS colorScheme change WITH a saved value: stays pinned and the value is kept", async ({
    page,
  }) => {
    await openClean(page, "light");
    const html = page.locator("html");

    await clickToggle(page); // pin "dark" while the OS is light
    await expect(html).toHaveAttribute("data-theme", "dark");
    expect(await savedTheme(page)).toBe("dark");

    // OS now matches the saved value: must NOT be removed (retroactive removal
    // would make pinning impossible for users whose OS switches by time of day).
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(250);
    await expect(html).toHaveAttribute("data-theme", "dark");
    expect(await savedTheme(page)).toBe("dark");

    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForTimeout(250);
    await expect(html).toHaveAttribute("data-theme", "dark");
    expect(await savedTheme(page)).toBe("dark");
    expect(await schemeMeta(page)).toBe("dark");
  });

  test("pinned light survives OS flips", async ({ page }) => {
    await openClean(page, "dark");
    await page.evaluate(() => localStorage.setItem("theme", "light"));
    await page.reload();
    await page.waitForLoadState("networkidle");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "light");

    await page.emulateMedia({ colorScheme: "light" });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(250);
    await expect(html).toHaveAttribute("data-theme", "light");
    expect(await savedTheme(page)).toBe("light");
  });

  test("two pages sharing a context: the storage event syncs the second", async ({
    page,
  }) => {
    await openClean(page, "light");
    const second = await page.context().newPage();
    await second.emulateMedia({ colorScheme: "light" });
    await second.goto("/en/");
    await second.waitForLoadState("networkidle");
    const secondHtml = second.locator("html");
    await expect(secondHtml).toHaveAttribute("data-theme", "light");

    await clickToggle(page); // pin dark in the first page
    await expect(secondHtml).toHaveAttribute("data-theme", "dark");
    expect(await schemeMeta(second)).toBe("dark");

    await clickToggle(page); // back to follow-system in the first page
    await expect(secondHtml).toHaveAttribute("data-theme", "light");
    expect(await savedTheme(second)).toBeNull();
    expect(await schemeMeta(second)).toBe("light dark");

    await second.close();
  });
});

/**
 * ClientRouter (client-side navigation)
 *
 * Layout.astro mounts <ClientRouter />, so navigation swaps the document's
 * root attributes and head instead of reloading. toggle-theme.js re-applies
 * the theme on astro:after-swap.
 */
test.describe("Dark Mode - ClientRouter navigation", () => {
  async function navigateClientSide(page: Page) {
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      w.__noReload = true;
      w.__swaps = 0;
      document.addEventListener("astro:after-swap", () => {
        w.__swaps = (w.__swaps as number) + 1;
      });
    });
    await ensureMenuOpen(page);
    await page.locator('a[href="/en/about"]:visible').first().click();
    await page.waitForURL("**/en/about**");
    await page.waitForLoadState("networkidle");

    const state = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      return { noReload: w.__noReload === true, swaps: w.__swaps as number };
    });
    // Guard: this must have been a client-side swap, not a full page load.
    expect(state.noReload).toBe(true);
    expect(state.swaps).toBeGreaterThanOrEqual(1);
  }

  test("a pinned theme survives an astro:after-swap navigation", async ({
    page,
  }) => {
    await openClean(page, "light");
    await clickToggle(page); // pin dark
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await navigateClientSide(page);

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await schemeMeta(page)).toBe("dark");
    expect(
      await page.evaluate(() => document.documentElement.style.colorScheme)
    ).toBe("dark");
    expect(
      await page.evaluate(() =>
        document
          .querySelector('meta[name="theme-color"]')
          ?.getAttribute("content")
      )
    ).toBe("#141517");
  });

  test("follow-system survives an astro:after-swap navigation and still toggles", async ({
    page,
  }) => {
    await openClean(page, "light");
    await navigateClientSide(page);

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await schemeMeta(page)).toBe("light dark");
    expect(await savedTheme(page)).toBeNull();

    // The toggle button on the swapped-in page must be re-bound.
    await clickToggle(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await savedTheme(page)).toBe("dark");
  });
});
