import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Typography", () => {
  test("should apply font optical sizing globally", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    const fontOpticalSizing = await page.evaluate(
      () => getComputedStyle(document.documentElement).fontOpticalSizing
    );

    expect(fontOpticalSizing).toBe("auto");
  });

  test("should have no axe violations on homepage", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
