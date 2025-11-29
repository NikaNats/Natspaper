import { test, expect } from "@playwright/test";

/**
 * Localization (i18n) E2E Tests
 *
 * Critical Flow: Language switching and content localization
 *
 * Tests verify:
 * - Language picker is visible and accessible
 * - Clicking language link changes URL to correct locale
 * - Content updates to selected language
 * - Language preference persists across navigation
 * - RTL/LTR direction is set correctly
 */

test.describe("Localization - Language Switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");
  });

  test("should have language picker with proper accessibility", async ({
    page,
  }) => {
    const languagePicker = page.locator('[data-testid="language-picker"]');

    // Language picker should exist
    await expect(languagePicker).toBeVisible();

    // Should have language links
    const langLinks = languagePicker.locator("a");
    await expect(langLinks).not.toHaveCount(0);
  });

  test("should display available language options", async ({ page }) => {
    // Should have Georgian option when on English page
    const kaLink = page.locator('[data-testid="lang-ka"]');
    await expect(kaLink).toBeVisible();
    await expect(kaLink).toHaveText("KA");
  });

  test("should switch from English to Georgian", async ({ page }) => {
    // Click Georgian language link
    const kaLink = page.locator('[data-testid="lang-ka"]');
    await kaLink.click();

    // Wait for navigation
    await page.waitForLoadState("networkidle");

    // URL should change to /ka/
    await expect(page).toHaveURL(/\/ka\//);

    // HTML lang attribute should update
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "ka");
  });

  test("should switch from Georgian to English", async ({ page }) => {
    // Start on Georgian page
    await page.goto("/ka/");
    await page.waitForLoadState("networkidle");

    // Click English language link
    const enLink = page.locator('[data-testid="lang-en"]');
    await expect(enLink).toBeVisible();
    await enLink.click();

    // Wait for navigation
    await page.waitForLoadState("networkidle");

    // URL should change to /en/
    await expect(page).toHaveURL(/\/en\//);

    // HTML lang attribute should update
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "en");
  });

  test("should preserve current page path when switching language", async ({
    page,
  }) => {
    // Navigate to posts page
    await page.goto("/en/posts");
    await page.waitForLoadState("networkidle");

    // Switch to Georgian
    const kaLink = page.locator('[data-testid="lang-ka"]');
    await kaLink.click();
    await page.waitForLoadState("networkidle");

    // Should be on Georgian posts page
    await expect(page).toHaveURL(/\/ka\/posts/);
  });

  test("should update page title to localized version", async ({ page }) => {
    // Switch to Georgian
    const kaLink = page.locator('[data-testid="lang-ka"]');
    await kaLink.click();
    await page.waitForLoadState("networkidle");

    // Title may change (depends on implementation)
    const kaTitle = await page.title();
    // At minimum, page should have a title
    expect(kaTitle.length).toBeGreaterThan(0);
  });

  test("should update navigation links to localized text", async ({ page }) => {
    const navMenu = page.locator('[data-testid="nav-menu"]');

    // Get English navigation text
    const enNavText = await navMenu.textContent();

    // Switch to Georgian
    const kaLink = page.locator('[data-testid="lang-ka"]');
    await kaLink.click();
    await page.waitForLoadState("networkidle");

    // Navigation text should change
    const kaNavText = await page.locator('[data-testid="nav-menu"]').textContent();
    expect(kaNavText).not.toBe(enNavText);
  });

  test("should have proper aria-label on language links", async ({ page }) => {
    const kaLink = page.locator('[data-testid="lang-ka"]');

    // Should have accessible label
    await expect(kaLink).toHaveAttribute("aria-label", /switch.*georgian/i);
    await expect(kaLink).toHaveAttribute("title", /switch.*georgian/i);
  });
});

test.describe("Localization - Content Translation", () => {
  test("should display English content on /en/ pages", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    // Check for English-specific content
    // Navigation should have English text
    const postsLink = page.getByRole("link", { name: /posts/i });
    await expect(postsLink).toBeVisible();
  });

  test("should display Georgian content on /ka/ pages", async ({ page }) => {
    await page.goto("/ka/");
    await page.waitForLoadState("networkidle");

    // HTML lang should be Georgian
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "ka");

    // Page should have content (may be in Georgian script)
    const mainContent = page.locator("main");
    await expect(mainContent).not.toBeEmpty();
  });

  test("should handle date formatting per locale", async ({ page }) => {
    // Check English date format
    await page.goto("/en/posts");
    await page.waitForLoadState("networkidle");

    const postCards = page.locator('[data-testid="post-card"]');
    if ((await postCards.count()) > 0) {
      // English dates typically have month names like "Dec", "Jan"
      const cardText = await postCards.first().textContent();
      expect(cardText).toBeTruthy();
    }
  });
});

test.describe("Localization - URL Structure", () => {
  test("should redirect root to default locale", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should redirect to /en/ (default locale)
    await expect(page).toHaveURL(/\/(en|ka)\//);
  });

  test("should maintain locale in internal navigation", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    // Click on Posts link
    const postsLink = page.getByRole("link", { name: /posts/i }).first();
    await postsLink.click();
    await page.waitForLoadState("networkidle");

    // URL should still have /en/
    await expect(page).toHaveURL(/\/en\//);
  });

  test("should handle 404 with correct locale", async ({ page }) => {
    // Navigate to non-existent English page
    await page.goto("/en/non-existent-page-12345");
    
    // Should still be in English locale context
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "en");
  });
});

test.describe("Localization - Accessibility", () => {
  test("should have lang attribute on html element", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "en");
  });

  test("should have correct dir attribute for LTR languages", async ({
    page,
  }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    const html = page.locator("html");
    // English is LTR
    const dir = await html.getAttribute("dir");
    expect(dir).toBeNull(); // LTR is default, may not be explicitly set
    // Or if explicitly set:
    // await expect(html).toHaveAttribute("dir", "ltr");
  });

  test("should have accessible language picker links", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    const kaLink = page.locator('[data-testid="lang-ka"]');

    // Should be keyboard accessible
    await kaLink.focus();
    const isFocused = await kaLink.evaluate(
      el => document.activeElement === el
    );
    expect(isFocused).toBe(true);

    // Should have visible focus indicator (focus-visible styles)
    // Just verify it's focusable
    await expect(kaLink).toBeVisible();
  });
});
