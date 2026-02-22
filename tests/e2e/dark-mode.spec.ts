import { test, expect } from "@playwright/test";

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

test.describe("Dark Mode Toggle", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any saved theme preference before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("theme"));
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("should have theme toggle button with proper accessibility", async ({
    page,
  }) => {
    const themeBtn = page.locator('[data-testid="theme-toggle"]');

    // Button should exist and be visible
    await expect(themeBtn).toBeVisible();

    // Should have accessible label
    await expect(themeBtn).toHaveAttribute("aria-label", /toggle|theme/i);

    // Should have title for tooltip
    await expect(themeBtn).toHaveAttribute("title", /theme/i);
  });

  test("should toggle theme from light to dark", async ({ page }) => {
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
    const themeBtn = page.locator('[data-testid="theme-toggle"]');
    const html = page.locator("html");

    // Set dark mode
    await page.evaluate(() => {
      localStorage.setItem("theme", "dark");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

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
    const themeBtn = page.locator('[data-testid="theme-toggle"]');

    // In light mode, moon icon should be visible (to switch to dark)
    // In dark mode, sun icon should be visible (to switch to light)
    // The icons use dark: prefix for visibility

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
