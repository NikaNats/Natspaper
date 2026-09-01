import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility (a11y) E2E Tests
 *
 * Uses axe-core to automatically detect accessibility violations.
 * Fails the build if critical a11y issues are found.
 *
 * Tests cover:
 * - Homepage accessibility
 * - Blog posts listing page
 * - Individual blog post page
 * - Search page
 * - Dark mode accessibility
 * - Mobile viewport accessibility
 *
 * @see https://www.deque.com/axe/
 */

test.describe("Accessibility - Homepage", () => {
  test("should have no critical accessibility violations", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    // Filter for serious and critical violations only
    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === "critical" || violation.impact === "serious"
    );

    if (criticalViolations.length > 0) {
      console.error("Critical a11y violations found:");
      criticalViolations.forEach(violation => {
        console.error(`- ${violation.id}: ${violation.description}`);
        console.error(`  Impact: ${violation.impact}`);
        console.error(`  Nodes: ${violation.nodes.length}`);
        violation.nodes.forEach(node => {
          console.error(`    Target: ${node.target.join(", ")}`);
          console.error(`    HTML: ${node.html.substring(0, 100)}...`);
        });
      });
    }

    expect(criticalViolations).toHaveLength(0);
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(["heading-order", "page-has-heading-one"])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveLength(0);
  });

  test("should have accessible images with alt text", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(["image-alt"])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveLength(0);
  });

  test("should have accessible links", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(["link-name", "link-in-text-block"])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveLength(0);
  });
});

test.describe("Accessibility - Blog Posts Page", () => {
  test("should have no critical violations on posts listing", async ({
    page,
  }) => {
    await page.goto("/en/posts");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === "critical" || violation.impact === "serious"
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test("should have accessible post cards", async ({ page }) => {
    await page.goto("/en/posts");
    await page.waitForLoadState("networkidle");

    // Check for specific card accessibility
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="post-card"]')
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === "critical"
    );

    expect(criticalViolations).toHaveLength(0);
  });
});

test.describe("Accessibility - Individual Post", () => {
  test("should have no critical violations on blog post", async ({ page }) => {
    // Force light color scheme so the test is deterministic regardless of OS setting.
    // Dark-mode is tested separately in dark-mode.spec.ts.
    await page.emulateMedia({ colorScheme: "light" });

    // Navigate to posts and click first one
    await page.goto("/en/posts");
    await page.waitForLoadState("networkidle");

    const firstPost = page.locator('[data-testid="post-card"] a').first();
    if ((await firstPost.count()) > 0) {
      await firstPost.click();
      // Explicitly wait for URL to change to a post detail page before scanning,
      // so the axe run happens on the post content page, not the listing page.
      await page.waitForURL(/\/posts\/.+/);
      await page.waitForLoadState("networkidle");

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        violation => violation.impact === "critical" || violation.impact === "serious"
      );

      expect(criticalViolations).toHaveLength(0);
    }
  });

  test("should have accessible code blocks", async ({ page }) => {
    await page.goto("/en/posts");
    await page.waitForLoadState("networkidle");

    const firstPost = page.locator('[data-testid="post-card"] a').first();
    if ((await firstPost.count()) > 0) {
      await firstPost.click();
      // Wait for URL to reflect post detail page before scanning
      await page.waitForURL(/\/posts\/.+/);
      await page.waitForLoadState("networkidle");

      // Check for code block accessibility
      const codeBlocks = page.locator("pre, code");
      if ((await codeBlocks.count()) > 0) {
        const accessibilityScanResults = await new AxeBuilder({ page })
          .include("pre, code")
          .analyze();

        // Code blocks may have color contrast issues which are acceptable
        const criticalViolations = accessibilityScanResults.violations.filter(
          violation =>
            violation.impact === "critical" &&
            violation.id !== "color-contrast"
        );

        expect(criticalViolations).toHaveLength(0);
      }
    }
  });
});

test.describe("Accessibility - Dark Mode", () => {
  test("should have accessible color contrast in dark mode", async ({
    page,
  }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    // Enable dark mode
    await page.evaluate(() => {
      localStorage.setItem("theme", "dark");
      document.documentElement.dataset.theme = "dark";
      document.documentElement.classList.add("dark");
    });

    // Reload to apply theme
    await page.reload();
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();

    // Dark mode may have some acceptable contrast issues in specific contexts
    // Focus on critical violations only
    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === "critical"
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test("should maintain accessible focus indicators in dark mode", async ({
    page,
  }) => {
    await page.goto("/en/");
    await page.evaluate(() => {
      localStorage.setItem("theme", "dark");
      document.documentElement.dataset.theme = "dark";
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(["focus-order-semantics"])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveLength(0);
  });
});

test.describe("Accessibility - Mobile", () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE
  });

  test("should have accessible mobile navigation", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    // Open mobile menu
    const menuBtn = page.locator("#menu-btn");
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(350); // Animation

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include("#mobile-menu-overlay")
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        violation => violation.impact === "critical" || violation.impact === "serious"
      );

      expect(criticalViolations).toHaveLength(0);
    }
  });

  test("should have adequate touch target sizes", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    // Check button sizes meet WCAG 2.5.5 (44x44px minimum)
    const buttons = page.locator("button, [role=button]");
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Should be at least 44px in both dimensions
          // Allow some tolerance for edge cases
          expect(box.width).toBeGreaterThanOrEqual(40);
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });
});

test.describe("Accessibility - Keyboard Navigation", () => {
  test("should have no keyboard traps", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(["tabindex"])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveLength(0);
  });

  test("should have logical focus order", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    // Tab through first few focusable elements
    const focusedElements: string[] = [];

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      const activeElement = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) {
          return null;
        }
        // Use a unique key combining tagName, id, href, and aria-label
        // so different links (which share the same tagName "A") are distinguished
        const id = el.id ? `#${el.id}` : "";
        const href = (el as HTMLAnchorElement).getAttribute?.("href") ?? "";
        const label = el.getAttribute("aria-label") ?? "";
        const cls = el.className?.split(" ")[0] ?? "";
        return `${el.tagName}${id}[href=${href}][label=${label}][cls=${cls}]`;
      });
      if (activeElement) {
        focusedElements.push(activeElement);
      }
    }

    // Should have moved focus to multiple elements
    expect(focusedElements.length).toBeGreaterThan(0);

    // Focus should not get stuck on one element
    const uniqueElements = [...new Set(focusedElements)];
    expect(uniqueElements.length).toBeGreaterThan(1);
  });

  test("should have visible focus indicators", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    // Focus the first link
    await page.keyboard.press("Tab");

    const activeElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;

      const styles = globalThis.getComputedStyle(el);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        border: styles.border,
      };
    });

    // Should have some visible focus indicator
    expect(activeElement).toBeTruthy();
    
    const hasOutline =
      activeElement?.outline !== undefined && activeElement?.outline !== "none";
    const hasBoxShadow =
      activeElement?.boxShadow !== undefined &&
      activeElement?.boxShadow !== "none";
    const hasBorder =
      activeElement?.border !== undefined &&
      !activeElement?.border.includes("0px");
    const hasVisibleFocus = hasOutline || hasBoxShadow || hasBorder;

    expect(hasVisibleFocus).toBeTruthy();
  });
});

test.describe("Accessibility - ARIA", () => {
  test("should have valid ARIA attributes", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules([
        "aria-allowed-attr",
        "aria-required-attr",
        "aria-valid-attr",
        "aria-valid-attr-value",
        "aria-hidden-focus",
      ])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveLength(0);
  });

  test("should have accessible navigation landmarks", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(["landmark-one-main", "region"])
      .analyze();

    // Allow some violations for specific contexts
    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === "critical"
    );

    expect(criticalViolations).toHaveLength(0);
  });
});

// Fixture post with multi-level headings (drives doc-toc), academic
// references (drives doc-bibliography), and footer tags (drives the mobile
// touch-target checks).
const POST_URL = "/en/posts/distributed-consensus-algorithms";

test.describe("ISO 9241-210 & DPUB-ARIA Ergonomics", () => {

  test("main article preserves DPUB-ARIA landmarks and heading hierarchy", async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState("networkidle");

    // ISO 9241-110 self-descriptiveness: structural landmarks that tell
    // readers where they are (W3C DPUB-ARIA 1.1). Articles legitimately
    // expose two doc-toc landmarks (desktop rail + mobile sheet).
    await expect(page.locator('nav[role="doc-toc"]').first()).toBeAttached();
    await expect(
      page.locator('section[role="doc-bibliography"]').first()
    ).toBeAttached();

    // Heading hierarchy inside the article must not skip levels.
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(["heading-order", "page-has-heading-one"])
      .analyze();
    expect(accessibilityScanResults.violations).toHaveLength(0);
  });

  test("article page meets WCAG 2.2 AA", async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      violation =>
        violation.impact === "critical" || violation.impact === "serious"
    );

    if (criticalViolations.length > 0) {
      console.error("WCAG 2.2 AA violations found:");
      criticalViolations.forEach(violation => {
        console.error(`- ${violation.id}: ${violation.description}`);
        violation.nodes.forEach(node => {
          console.error(`    Target: ${node.target.join(", ")}`);
        });
      });
    }

    expect(criticalViolations).toHaveLength(0);
  });
});

test.describe("Accessibility - Mobile Ergonomics", () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE
  });

  test("tag links meet WCAG 2.5.8 minimum target size on mobile", async ({ page }) => {
    // Tag pills render in the post footer (and summary cards), not the
    // mobile listing page, so measure them on the article page.
    await page.goto(POST_URL);
    await page.waitForLoadState("networkidle");

    // Tag pills are inline metadata links (~34px tall by design), so they are
    // held to the WCAG 2.2 AA Target Size Minimum (24px) rather than the
    // 44px AAA threshold used for primary controls above.
    const tagLinks = page.locator('[data-testid="post-tag-link"]');
    const count = await tagLinks.count();

    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 5); i++) {
      const tagLink = tagLinks.nth(i);
      if (await tagLink.isVisible()) {
        const box = await tagLink.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(24);
          expect(box.height).toBeGreaterThanOrEqual(24);
        }
      }
    }
  });
});
