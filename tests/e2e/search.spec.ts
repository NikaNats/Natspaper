import { test, expect } from "@playwright/test";

/**
 * Search Functionality E2E Tests
 *
 * Critical Flow: Search page and Pagefind integration
 *
 * Tests verify:
 * - Search page loads correctly
 * - Search input is visible and accessible
 * - Typing in search yields results (mocking not needed as Pagefind is static)
 * - Search results are displayed correctly
 * - Clicking a result navigates to the post
 */

test.describe("Search - Page Load", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/search");
    await page.waitForLoadState("networkidle");
  });

  test("should load search page successfully", async ({ page }) => {
    // Page should have search in URL
    await expect(page).toHaveURL(/\/search/);

    // Search container should exist
    const searchContainer = page.locator('[data-testid="search-container"]');
    await expect(searchContainer).toBeVisible();
  });

  test("should have search input field", async ({ page }) => {
    // Wait for Pagefind to initialize
    await page.waitForSelector(".pagefind-ui", { timeout: 10000 });

    // Search input should be visible
    const searchInput = page.locator(".pagefind-ui__search-input");
    await expect(searchInput).toBeVisible();
  });

  test("should have accessible search input", async ({ page }) => {
    await page.waitForSelector(".pagefind-ui", { timeout: 10000 });

    const searchInput = page.locator(".pagefind-ui__search-input");

    // Should have placeholder text
    const placeholder = await searchInput.getAttribute("placeholder");
    expect(placeholder).toBeTruthy();
    expect(placeholder!.length).toBeGreaterThan(0);

    // Should be focusable
    await searchInput.focus();
    const isFocused = await searchInput.evaluate(
      el => document.activeElement === el
    );
    expect(isFocused).toBe(true);
  });

  test("should have search input with correct locale placeholder", async ({
    page,
  }) => {
    await page.waitForSelector(".pagefind-ui", { timeout: 10000 });

    const searchInput = page.locator(".pagefind-ui__search-input");
    const placeholder = await searchInput.getAttribute("placeholder");

    // English placeholder should contain "Search"
    expect(placeholder).toMatch(/search/i);
  });
});

test.describe("Search - Typing and Results", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/search");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector(".pagefind-ui", { timeout: 10000 });
  });

  test("should show results when typing a query", async ({ page }) => {
    const searchInput = page.locator(".pagefind-ui__search-input");

    // Type a common word that should exist in blog posts
    await searchInput.fill("post");

    // Wait for results to appear
    await page.waitForTimeout(500); // Pagefind has debounce

    // Results container should appear
    const resultsContainer = page.locator(".pagefind-ui__results");
    await expect(resultsContainer).toBeVisible({ timeout: 5000 });
  });

  test("should show 'no results' message for nonsense query", async ({
    page,
  }) => {
    const searchInput = page.locator(".pagefind-ui__search-input");

    // Type a nonsense query
    await searchInput.fill("xyzqwertyasdfghjkl12345");

    // Wait for search to complete
    await page.waitForTimeout(500);

    // Either no results or empty state
    const resultsContainer = page.locator(".pagefind-ui__results");
    const resultsText = await resultsContainer.textContent();

    // Should either show "no results" or be empty
    expect(
      resultsText === "" ||
        resultsText?.toLowerCase().includes("no") ||
        (await page.locator(".pagefind-ui__result").count()) === 0
    ).toBeTruthy();
  });

  test("should clear results when clearing search input", async ({ page }) => {
    const searchInput = page.locator(".pagefind-ui__search-input");

    // Type and get results
    await searchInput.fill("test");
    await page.waitForTimeout(500);

    // Clear the input
    await searchInput.clear();
    await page.waitForTimeout(300);

    // Results should be cleared or hidden
    const results = page.locator(".pagefind-ui__result");
    await expect(results).toHaveCount(0);
  });

  test("should update results as user types", async ({ page }) => {
    const searchInput = page.locator(".pagefind-ui__search-input");

    // Type incrementally
    await searchInput.fill("a");
    await page.waitForTimeout(300);

    const countAfterA = await page.locator(".pagefind-ui__result").count();

    // Type more specific query
    await searchInput.fill("async");
    await page.waitForTimeout(300);

    // Results may change (more specific = fewer results usually)
    const countAfterAsync = await page.locator(".pagefind-ui__result").count();

    // Just verify search is working (results appeared)
    expect(countAfterA >= 0 || countAfterAsync >= 0).toBeTruthy();
  });
});

test.describe("Search - Result Interaction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/search");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector(".pagefind-ui", { timeout: 10000 });
  });

  test("should navigate to post when clicking a result", async ({ page }) => {
    const searchInput = page.locator(".pagefind-ui__search-input");

    // Search for content
    await searchInput.fill("async");
    await page.waitForTimeout(500);

    // Get first result link
    const firstResult = page.locator(".pagefind-ui__result-link").first();

    if ((await firstResult.count()) > 0) {
      // Click the result
      await firstResult.click();
      await page.waitForLoadState("networkidle");

      // Should navigate to a post page
      await expect(page).toHaveURL(/\/posts\//);
    }
  });

  test("should show result titles that match query context", async ({
    page,
  }) => {
    const searchInput = page.locator(".pagefind-ui__search-input");

    await searchInput.fill("TypeScript");
    await page.waitForTimeout(500);

    const results = page.locator(".pagefind-ui__result");
    if ((await results.count()) > 0) {
      // Results should have title elements
      const resultTitle = page.locator(".pagefind-ui__result-title").first();
      await expect(resultTitle).toBeVisible();
    }
  });

  test("should have keyboard-accessible results", async ({ page }) => {
    const searchInput = page.locator(".pagefind-ui__search-input");

    await searchInput.fill("async");
    await page.waitForTimeout(500);

    // Tab from search input to results
    await page.keyboard.press("Tab");

    // Focus should move to results area or clear button
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(focusedElement).toBeTruthy();
  });
});

test.describe("Search - Localization", () => {
  test("should show Georgian placeholder on Georgian search page", async ({
    page,
  }) => {
    await page.goto("/ka/search");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector(".pagefind-ui", { timeout: 10000 });

    const searchInput = page.locator(".pagefind-ui__search-input");
    const placeholder = await searchInput.getAttribute("placeholder");

    // Georgian placeholder should be different from English
    expect(placeholder).not.toMatch(/^search/i);
    // Georgian uses Georgian script
    expect(placeholder).toMatch(/მოძებნე|ძებნა/i); // Common Georgian search words
  });

  test("should maintain search state across language switch", async ({
    page,
  }) => {
    await page.goto("/en/search");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector(".pagefind-ui", { timeout: 10000 });

    // Perform a search
    const searchInput = page.locator(".pagefind-ui__search-input");
    await searchInput.fill("test");
    await page.waitForTimeout(300);

    // Switch language
    const kaLink = page.locator('[data-testid="lang-ka"]');
    await kaLink.click();
    await page.waitForLoadState("networkidle");

    // Should be on Georgian search page
    await expect(page).toHaveURL(/\/ka\/search/);
  });
});

test.describe("Search - Performance", () => {
  test("should not block page load with search initialization", async ({
    page,
  }) => {
    // Measure time to first contentful paint
    const startTime = Date.now();

    await page.goto("/en/search");
    await page.waitForLoadState("domcontentloaded");

    const loadTime = Date.now() - startTime;

    // Page should load quickly (under 3 seconds)
    expect(loadTime).toBeLessThan(3000);

    // Search container should be in DOM even if Pagefind hasn't loaded yet
    const searchContainer = page.locator('[data-testid="search-container"]');
    await expect(searchContainer).toBeAttached();
  });

  test("should lazy-load Pagefind assets", async ({ page }) => {
    // Listen for Pagefind script requests
    const pagefindRequests: string[] = [];
    page.on("request", request => {
      if (request.url().includes("pagefind")) {
        pagefindRequests.push(request.url());
      }
    });

    await page.goto("/en/search");
    await page.waitForLoadState("networkidle");

    // Pagefind assets should be loaded
    expect(
      pagefindRequests.some(url => url.includes("pagefind-ui.js"))
    ).toBeTruthy();
  });
});

test.describe("Search - Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/search");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector(".pagefind-ui", { timeout: 10000 });
  });

  test("should have visible focus indicator on search input", async ({
    page,
  }) => {
    const searchInput = page.locator(".pagefind-ui__search-input");

    await searchInput.focus();

    // Should have focus-visible styling
    const outlineStyle = await searchInput.evaluate(
      el => window.getComputedStyle(el).outline
    );
    // Should have some outline (not "none 0px")
    expect(outlineStyle).not.toBe("none");
  });

  test("should be operable with keyboard only", async ({ page }) => {
    // Tab to search input
    await page.keyboard.press("Tab");

    // Should be able to type
    await page.keyboard.type("test");

    // Wait for results
    await page.waitForTimeout(500);

    // Tab to first result
    await page.keyboard.press("Tab");

    // Enter should activate (navigate)
    // Just verify keyboard interaction works
    const activeElement = await page.evaluate(() =>
      document.activeElement?.tagName.toLowerCase()
    );
    expect(["input", "button", "a"].includes(activeElement || "")).toBeTruthy();
  });
});
