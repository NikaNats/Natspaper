import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Typography", () => {
  test("should have font optical sizing set to auto", async ({ page }) => {
    await page.goto("/en/");

    const fontOpticalSizing = await page.evaluate(
      () => getComputedStyle(document.documentElement).fontOpticalSizing
    );

    expect(fontOpticalSizing).toBe("auto");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
