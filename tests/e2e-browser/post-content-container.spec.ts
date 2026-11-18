import { test, expect, type Page } from "@playwright/test";

/**
 * PostContent Container Query Tests
 * ==================================
 * Verifies that container queries in PostContent.astro actually fire.
 *
 * Bug: `.post-content` was missing `container-type: inline-size` and
 * `container-name: post-content`, making ALL `@container post-content`
 * queries dead code.
 *
 * Strategy:
 * 1. Verify container-type is set via computed style
 * 2. Narrow viewport (< 400px) → full-bleed code blocks (border-radius: 0)
 * 3. Wide viewport (> 700px) → enhanced border-radius on images
 */

/** Navigate to the first available blog post */
async function goToFirstPost(page: Page) {
  await page.goto("/en/posts");
  // cspell:ignore networkidle
  await page.waitForLoadState("networkidle");

  const firstPostLink = page.locator('a[href*="/en/posts/"]').first();
  await expect(firstPostLink).toBeVisible({ timeout: 10_000 });

  const href = await firstPostLink.getAttribute("href");
  if (href) {
    await page.goto(href);
    // cspell:ignore networkidle
    await page.waitForLoadState("networkidle");
  }

  // Wait for article content to render
  await expect(page.getByTestId("post-content")).toBeVisible({
    timeout: 10_000,
  });
}

test.describe("PostContent — Container Queries", () => {
  test("should have container-type: inline-size on .post-content", async ({
    page,
  }) => {
    await goToFirstPost(page);

    const containerType = await page
      .getByTestId("post-content")
      .evaluate(el => getComputedStyle(el).containerType);

    // If this fails → container queries are DEAD CODE
    expect(containerType).toBe("inline-size");
  });

  test("should have container-name: post-content", async ({ page }) => {
    await goToFirstPost(page);

    const containerName = await page
      .getByTestId("post-content")
      .evaluate(el => getComputedStyle(el).containerName);

    expect(containerName).toBe("post-content");
  });

  test("narrow container (< 400px): code blocks should be full-bleed", async ({
    page,
  }) => {
    // Force narrow viewport → container width < 400px
    await page.setViewportSize({ width: 375, height: 812 });
    await goToFirstPost(page);

    // Check if post has code blocks
    const codeBlock = page
      .getByTestId("post-content")
      .locator("pre, .astro-code")
      .first();

    if ((await codeBlock.count()) === 0) {
      test.skip(true, "Post has no code blocks to test");
    }

    // Full-bleed: border-radius should be 0 on narrow containers
    const borderRadius = await codeBlock.evaluate(
      el => getComputedStyle(el).borderRadius,
    );

    expect(borderRadius).toBe("0px");
  });

  test("wide container (≥ 700px): images should have 1rem (18px) border-radius", async ({
    page,
  }) => {
    // Force wide viewport → container width > 700px
    await page.setViewportSize({ width: 1280, height: 900 });
    await goToFirstPost(page);

    const image = page.getByTestId("post-content").locator("img").first();

    if ((await image.count()) === 0) {
      test.skip(true, "Post has no images to test");
    }

    const borderRadius = await image.evaluate(
      el => getComputedStyle(el).borderRadius,
    );

    // @container post-content (min-width: 700px) → border-radius: 1rem.
    // Container queries are px-based on purpose: the article column is a fixed
    // ~732px, while rem scales with the root (18px on desktop), so a rem
    // threshold (43.75rem = 787px) would never match inside it.
    expect(borderRadius).toBe("18px"); // 1rem at the 18px desktop root
  });

  test("narrow container: images should have 0 border-radius", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await goToFirstPost(page);

    const image = page.getByTestId("post-content").locator("img").first();

    if ((await image.count()) === 0) {
      test.skip(true, "Post has no images to test");
    }

    const borderRadius = await image.evaluate(
      el => getComputedStyle(el).borderRadius,
    );

    // @container post-content (max-width: 400px) → border-radius: 0
    expect(borderRadius).toBe("0px");
  });
});