import { test, expect } from "@playwright/test";

test.describe("Academic Journey & Focus Architecture", () => {
  test("maintains correct keyboard focus order across disclosure TOC navigation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // Mobile viewport
    await page.goto("/en/posts/distributed-consensus-algorithms");
    await page.waitForLoadState("networkidle");

    const details = page.locator("#mobile-toc-details");
    const summary = details.locator("summary");

    // 1. Open TOC
    await summary.click();
    await expect(details).toHaveAttribute("open", "");

    // 2. Click the first section link
    const firstTocLink = details.locator(".mobile-toc-link").first();
    const targetHref = await firstTocLink.getAttribute("href");
    const targetId = targetHref?.slice(1);

    await firstTocLink.click();

    // 3. Verify disclosure automatically closed
    await expect(details).not.toHaveAttribute("open", "");

    // 4. Verify focus is assigned to destination heading for screen reader continuation
    const targetHeading = page.locator(`#${targetId}`);
    await expect(targetHeading).toBeFocused();

    // 5. Verify heading is not occluded by sticky header (clearance >= 64px)
    const box = await targetHeading.boundingBox();
    expect(box?.y).toBeGreaterThanOrEqual(64);
  });

  test("disallows double-locale URL generation on fallback articles", async ({
    page,
  }) => {
    await page.goto("/ka/posts/distributed-consensus-algorithms");
    await page.waitForLoadState("networkidle");

    // The canonical tag must point to the English root, not /ka/posts/en/...
    const canonical = page.locator('link[rel="canonical"]');
    const href = await canonical.getAttribute("href");

    expect(href).not.toContain("/posts/en/");
    expect(href).toMatch(/\/en\/posts\/distributed-consensus-algorithms/);

    // Fallback disclaimer must be present and labeled in Georgian
    const disclaimer = page.locator(".fallback-disclaimer");
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toHaveAttribute("lang", "ka-GE");

    // Article body must be explicitly tagged as English
    const article = page.locator("#article");
    await expect(article).toHaveAttribute("lang", "en-US");
  });
});
