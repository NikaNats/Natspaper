import { expect, type Page } from "@playwright/test";

/**
 * Below the `md` breakpoint the nav (theme toggle, language picker, links)
 * lives inside a full-screen overlay that is `visibility: hidden` until the
 * hamburger is opened. Playwright's actionability checks therefore time out
 * on those controls unless the menu is open first.
 *
 * No-op on desktop, where the hamburger is not rendered, and when the menu is
 * already open. Waits for the overlay's own state instead of a fixed delay.
 */
export async function ensureMenuOpen(page: Page): Promise<void> {
  const menuBtn = page.locator("#menu-btn");
  if (!(await menuBtn.isVisible())) return;

  const overlay = page.locator("#mobile-menu-overlay");
  if ((await overlay.getAttribute("data-state")) === "open") return;

  await menuBtn.click();
  await expect(overlay).toHaveAttribute("data-state", "open");
  await expect(overlay).toBeVisible();
}
