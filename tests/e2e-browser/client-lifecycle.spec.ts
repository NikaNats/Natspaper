import { test, expect } from "@playwright/test";

/**
 * Regressions for client-side state that must survive (or must NOT survive)
 * Astro ClientRouter navigations.
 */

const POST_URL = "/en/posts/system-design-part-1";

test.describe("Theme toggle keeps every theme signal in sync", () => {
  test("color-scheme follows the toggle without a reload", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/en/");

    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-theme", "light");
    expect(await root.evaluate(el => el.style.colorScheme)).toBe("light");

    await page.getByTestId("theme-toggle").first().click();

    await expect(root).toHaveAttribute("data-theme", "dark");
    // The inline style outranks the stylesheet, so it must be updated too.
    expect(await root.evaluate(el => el.style.colorScheme)).toBe("dark");
    expect(
      await root.evaluate(el => getComputedStyle(el).colorScheme)
    ).toBe("dark");
  });
});

test.describe("Post-only features stay on post pages", () => {
  test("no progress bar or heading anchors after navigating away from a post", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "ClientRouter timing is unreliable on WebKit in dev");

    await page.goto(POST_URL);
    await expect(page.locator("#progress-container")).toHaveCount(1);
    await expect(page.locator("#article .has-heading-link").first()).toBeAttached();

    // Client-side navigation (not a full load) to a non-post page
    await page.locator('header a[href="/en/"]').first().click();
    await page.waitForURL(/\/en\/?$/);
    await expect(page.locator("#main-content")).toBeVisible();

    await expect(page.locator("#progress-container")).toHaveCount(0);
    await expect(page.locator(".has-heading-link")).toHaveCount(0);
  });
});
