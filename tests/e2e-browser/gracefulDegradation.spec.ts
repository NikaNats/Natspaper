/**
 * Graceful Degradation E2E Tests
 * ================================
 * Verifies that the site's core functionality survives the unavailability of
 * third-party services.  Uses Playwright's `page.route()` to intercept and
 * block external requests, simulating real-world outage scenarios:
 *
 *   - giscus.app unavailable (503 / network error)
 *   - Google Fonts CDN timing out
 *
 * These tests assert that the page renders its primary content correctly and
 * does not throw unhandled errors, even when optional services are down.
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when the request URL belongs to the external domain.
 */
function matchesDomain(url: string, domain: string): boolean {
  try {
    return new URL(url).hostname.includes(domain);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe("Graceful Degradation: Third-party Service Outages", () => {
  test.describe.configure({ mode: "parallel" });

  // -------------------------------------------------------------------------
  // 1. Giscus unavailable
  // -------------------------------------------------------------------------
  test.describe("when giscus.app is unreachable", () => {
    test("the homepage renders without errors", async ({ page }) => {
      // Block all requests to giscus.app (simulates 503 / DNS failure)
      await page.route("**/*", route => {
        if (matchesDomain(route.request().url(), "giscus.app")) {
          route.abort("failed");
        } else {
          route.continue();
        }
      });

      const jsErrors: string[] = [];
      page.on("pageerror", err => jsErrors.push(err.message));

      await page.goto("/en");
      await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

      // The primary content must be intact
      await expect(page.locator("body")).not.toBeEmpty();
      // Giscus failure must not bubble up as an unhandled JS exception
      expect(jsErrors.filter(e => !/giscus/i.test(e))).toHaveLength(0);
    });

    test("a blog post page renders without the comments widget", async ({
      page,
    }) => {
      await page.route("**/*", route => {
        if (matchesDomain(route.request().url(), "giscus.app")) {
          route.abort("failed");
        } else {
          route.continue();
        }
      });

      const jsErrors: string[] = [];
      page.on("pageerror", err => jsErrors.push(err.message));

      await page.goto("/en/posts");

      // If there are no posts the test is irrelevant — skip gracefully
      const cards = page.getByTestId("post-card");
      const count = await cards.count();
      test.skip(count === 0, "No posts to navigate to.");

      await cards.first().getByRole("link").click();
      await page.waitForLoadState("domcontentloaded");

      // Post title must be visible
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
      // Post content must be rendered
      await expect(page.getByTestId("post-content")).toBeVisible();

      // No unhandled JS exceptions (giscus abort errors are expected and
      // should be caught inside Comments.astro's error handlers)
      const unexpectedErrors = jsErrors.filter(
        e => !/giscus|intersection/i.test(e)
      );
      expect(unexpectedErrors).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Google Fonts unavailable
  // -------------------------------------------------------------------------
  test.describe("when Google Fonts CDN is unavailable", () => {
    test("the homepage renders with fallback fonts", async ({ page }) => {
      // Block fonts.googleapis.com and fonts.gstatic.com
      await page.route("**/*", route => {
        const url = route.request().url();
        if (
          matchesDomain(url, "fonts.googleapis.com") ||
          matchesDomain(url, "fonts.gstatic.com")
        ) {
          route.abort("failed");
        } else {
          route.continue();
        }
      });

      const jsErrors: string[] = [];
      page.on("pageerror", err => jsErrors.push(err.message));

      await page.goto("/en");
      await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

      // Primary content must still be accessible — layout must not collapse
      const bodyText = await page.locator("body").textContent();
      expect(bodyText?.trim().length).toBeGreaterThan(0);

      // Font failures are logged by the browser but must not cause JS errors
      expect(jsErrors).toHaveLength(0);
    });

    test("navigation between pages still works", async ({ page }) => {
      await page.route("**/*", route => {
        const url = route.request().url();
        if (
          matchesDomain(url, "fonts.googleapis.com") ||
          matchesDomain(url, "fonts.gstatic.com")
        ) {
          route.abort("failed");
        } else {
          route.continue();
        }
      });

      await page.goto("/en");
      await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

      // Navigate to the posts listing page
      const postsLink = page
        .getByRole("navigation")
        .getByRole("link", { name: /posts/i })
        .first();

      if (await postsLink.isVisible()) {
        await postsLink.click();
        await page.waitForLoadState("domcontentloaded");
        // Should not land on an error page
        const url = page.url();
        expect(url).not.toContain("404");
        await expect(page.locator("main")).toBeVisible();
      }
    });
  });

  // -------------------------------------------------------------------------
  // 3. Both third-party services offline simultaneously
  // -------------------------------------------------------------------------
  test("site remains functional when ALL third-party scripts are blocked", async ({
    page,
  }) => {
    const blockedDomains = ["giscus.app", "fonts.googleapis.com", "fonts.gstatic.com"];

    await page.route("**/*", route => {
      const url = route.request().url();
      if (blockedDomains.some(d => matchesDomain(url, d))) {
        route.abort("failed");
      } else {
        route.continue();
      }
    });

    const jsErrors: string[] = [];
    page.on("pageerror", err => jsErrors.push(err.message));

    await page.goto("/en");
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    // Critical nav elements must still work
    const nav = page.getByRole("navigation").first();
    await expect(nav).toBeVisible();

    // Dark mode toggle (pure JS, no third-party) must be present
    const themeButton = page.getByTestId("theme-btn");
    if ((await themeButton.count()) > 0) {
      await expect(themeButton).toBeEnabled();
    }

    // No JS exceptions from blocked resources
    const unexpectedErrors = jsErrors.filter(
      e => !/giscus|font/i.test(e)
    );
    expect(unexpectedErrors).toHaveLength(0);
  });
});
