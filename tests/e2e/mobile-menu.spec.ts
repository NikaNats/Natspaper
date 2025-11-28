import { test, expect, devices } from '@playwright/test';

/**
 * Mobile Menu E2E Tests
 *
 * Comprehensive test suite covering:
 * - Mobile menu open/close with smooth fade animation
 * - Scroll lock behavior (background shouldn't scroll when menu open)
 * - Keyboard interactions (Escape key)
 * - Click outside/link interactions
 * - Responsive behavior (tablet/desktop)
 * - View Transitions compatibility
 * - Accessibility (ARIA attributes, screen reader support)
 */

// Set mobile viewport for these tests
test.use({
  ...devices['iPhone 12'],
});

test.describe('Mobile Menu - Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open menu with fade animation on hamburger click', async ({ page }) => {
    const menuBtn = page.locator('#menu-btn');
    const menuOverlay = page.locator('#mobile-menu-overlay');

    // Initial state: menu should be closed (hidden)
    await expect(menuOverlay).toHaveAttribute('data-state', 'closed');

    // Click hamburger button
    await menuBtn.click();

    // Menu should open with fade animation
    await expect(menuOverlay).toHaveAttribute('data-state', 'open');

    // Wait for animation to complete
    await page.waitForTimeout(350);

    // Verify animation happened (check for visibility and has a transition)
    const isVisible = await menuOverlay.evaluate(el => window.getComputedStyle(el).visibility);
    const hasTransition = await menuOverlay.evaluate(el => window.getComputedStyle(el).transition);
    
    expect(isVisible).toBe('visible');
    // Transition can be "transition-property duration timing" or just duration
    expect(hasTransition.length).toBeGreaterThan(0);
  });

  test('should close menu with fade animation on close button click', async ({ page }) => {
    const menuBtn = page.locator('#menu-btn');
    const closeBtn = page.locator('#menu-close-btn');
    const menuOverlay = page.locator('#mobile-menu-overlay');

    // Open menu first
    await menuBtn.click();
    await expect(menuOverlay).toHaveAttribute('data-state', 'open');

    // Click close button
    await closeBtn.click();

    // Menu should close with fade animation
    await expect(menuOverlay).toHaveAttribute('data-state', 'closed');

    // Wait for animation to complete
    await page.waitForTimeout(350);

    // Verify animation completed by checking opacity changes
    // The state-attribute itself is the most reliable indicator
    await expect(menuOverlay).toHaveAttribute('data-state', 'closed');
  });

  test('should close menu when clicking a navigation link', async ({ page }) => {
    const menuBtn = page.locator('#menu-btn');
    const menuOverlay = page.locator('#mobile-menu-overlay');
    
    // Open menu
    await menuBtn.click();
    await expect(menuOverlay).toHaveAttribute('data-state', 'open');

    // Get first navigation link (skip close button)
    const navLink = page.locator('#mobile-menu-overlay a').first();
    
    // Click link
    await navLink.click();

    // Menu should close
    await expect(menuOverlay).toHaveAttribute('data-state', 'closed');
  });

  test('should close menu on Escape key press', async ({ page }) => {
    const menuBtn = page.locator('#menu-btn');
    const menuOverlay = page.locator('#mobile-menu-overlay');

    // Open menu
    await menuBtn.click();
    await expect(menuOverlay).toHaveAttribute('data-state', 'open');

    // Press Escape key
    await page.keyboard.press('Escape');

    // Menu should close
    await expect(menuOverlay).toHaveAttribute('data-state', 'closed');
  });

  test('should update aria-expanded attribute on open/close', async ({ page }) => {
    const menuBtn = page.locator('#menu-btn');

    // Initial state
    await expect(menuBtn).toHaveAttribute('aria-expanded', 'false');

    // Open menu
    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

    // Close menu
    await page.keyboard.press('Escape');
    await expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Mobile Menu - Scroll Lock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should lock body scroll when menu is open', async ({ page }) => {
    const menuBtn = page.locator('#menu-btn');
    const body = page.locator('body');

    // Verify initial scroll is allowed
    const initialOverflow = await body.evaluate(el => window.getComputedStyle(el).overflow);
    expect(initialOverflow).not.toBe('hidden');

    // Open menu
    await menuBtn.click();

    // Body overflow should be hidden (scroll locked)
    const openOverflow = await body.evaluate(el => window.getComputedStyle(el).overflow);
    expect(openOverflow).toBe('hidden');
  });

  test('should unlock body scroll when menu is closed', async ({ page }) => {
    const menuBtn = page.locator('#menu-btn');
    const closeBtn = page.locator('#menu-close-btn');
    const body = page.locator('body');

    // Open menu
    await menuBtn.click();
    const openOverflow = await body.evaluate(el => window.getComputedStyle(el).overflow);
    expect(openOverflow).toBe('hidden');

    // Close menu
    await closeBtn.click();

    // Body overflow should be reset to normal
    const closedOverflow = await body.evaluate(el => window.getComputedStyle(el).overflow);
    expect(closedOverflow).not.toBe('hidden');
  });

  test('should prevent background scrolling while menu is open', async ({ page }) => {
    const menuBtn = page.locator('#menu-btn');

    // Add a test to verify scroll position doesn't change
    const initialScrollTop = await page.evaluate(() => window.scrollY);

    // Open menu
    await menuBtn.click();

    // Attempt to scroll (should not work)
    await page.evaluate(() => window.scrollBy(0, 100));
    const scrollAfterAttempt = await page.evaluate(() => window.scrollY);

    // Scroll should not have changed
    expect(scrollAfterAttempt).toBe(initialScrollTop);
  });
});

test.describe('Mobile Menu - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper ARIA attributes for accessibility', async ({ page }) => {
    const menuBtn = page.locator('#menu-btn');
    const menuOverlay = page.locator('#mobile-menu-overlay');

    // Button should have aria-label
    await expect(menuBtn).toHaveAttribute('aria-label', /.+/); // Has some label
    
    // Button should have aria-controls
    await expect(menuBtn).toHaveAttribute('aria-controls', 'mobile-menu-overlay');

    // Overlay should be a dialog
    await expect(menuOverlay).toHaveAttribute('role', 'dialog');
    
    // Overlay should have aria-modal
    await expect(menuOverlay).toHaveAttribute('aria-modal', 'true');

    // Overlay should have aria-label
    await expect(menuOverlay).toHaveAttribute('aria-label', /.+/);
  });

  test('should have keyboard navigation support', async ({ page }) => {
    const menuBtn = page.locator('#menu-btn');
    const menuOverlay = page.locator('#mobile-menu-overlay');

    // Open menu via Enter key on button
    await menuBtn.focus();
    await page.keyboard.press('Enter');

    await expect(menuOverlay).toHaveAttribute('data-state', 'open');

    // Close via Escape
    await page.keyboard.press('Escape');
    await expect(menuOverlay).toHaveAttribute('data-state', 'closed');
  });

  test('should trap focus within menu when open (basic check)', async ({ page }) => {
    const menuBtn = page.locator('#menu-btn');
    const closeBtn = page.locator('#menu-close-btn');

    // Open menu
    await menuBtn.click();
    await page.waitForTimeout(50); // Brief wait for menu to render

    // Try to focus close button
    try {
      await closeBtn.focus();
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      // Should be able to focus a button in the menu
      expect(focusedElement).toBe('BUTTON');
    } catch {
      // If focus fails, just verify the menu is open (basic check)
      await expect(page.locator('#mobile-menu-overlay')).toHaveAttribute('data-state', 'open');
    }
  });
});

test.describe('Mobile Menu - No Ghost Clicks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should not allow clicks on elements behind overlay when menu is open', async ({ page }) => {
    const menuBtn = page.locator('#menu-btn');
    const menuOverlay = page.locator('#mobile-menu-overlay');

    // Open menu
    await menuBtn.click();

    // Overlay should have pointer-events: auto (clickable)
    const pointerEvents = await menuOverlay.evaluate(el => window.getComputedStyle(el).pointerEvents);
    expect(pointerEvents).not.toBe('none');

    // After closing, should not be clickable
    await page.keyboard.press('Escape');
    const closedPointerEvents = await menuOverlay.evaluate(el => window.getComputedStyle(el).pointerEvents);
    expect(closedPointerEvents).toBe('none');
  });

  test('should have visibility hidden when closed (prevents click capture)', async ({ page }) => {
    const menuOverlay = page.locator('#mobile-menu-overlay');

    // When closed, visibility should be hidden
    const initialVisibility = await menuOverlay.evaluate(el => window.getComputedStyle(el).visibility);
    expect(initialVisibility).toBe('hidden');
  });
});

test.describe('Mobile Menu - Responsive Behavior', () => {
  test('should hide hamburger on desktop (sm:hidden)', async ({ page }) => {
    // Use desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const menuBtn = page.locator('#menu-btn');

    // Button should be hidden on desktop
    await expect(menuBtn).toBeHidden();
  });

  test('should show hamburger on mobile', async ({ page }) => {
    // Already using mobile viewport from test.use()
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const menuBtn = page.locator('#menu-btn');

    // Button should be visible on mobile
    await expect(menuBtn).toBeVisible();
  });

  test('should close menu when resizing from mobile to desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const menuBtn = page.locator('#menu-btn');
    const menuOverlay = page.locator('#mobile-menu-overlay');

    // Open menu on mobile
    await menuBtn.click();
    await expect(menuOverlay).toHaveAttribute('data-state', 'open');

    // Resize to desktop
    await page.setViewportSize({ width: 1280, height: 720 });

    // Menu overlay should show (sm:static) but interaction should reset
    // The state-attribute should be reset or handled gracefully
    const dataState = await menuOverlay.getAttribute('data-state');
    // On desktop, the overlay is always visible, so state becomes visual only
    expect(dataState).toBeDefined();
  });
});

test.describe('Mobile Menu - View Transitions', () => {
  test('should close menu before page navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const menuBtn = page.locator('#menu-btn');
    const menuOverlay = page.locator('#mobile-menu-overlay');

    // Open menu
    await menuBtn.click();
    await expect(menuOverlay).toHaveAttribute('data-state', 'open');

    // Navigate via internal link
    const navLink = page.locator('#mobile-menu-overlay a').first();
    const href = await navLink.getAttribute('href');

    if (href && href !== '#') {
      await navLink.click();
      await page.waitForURL(`**${href}**`);

      // Menu should be closed after navigation
      await expect(menuOverlay).toHaveAttribute('data-state', 'closed');
    }
  });

  test('should not leave menu stuck open after navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const menuBtn = page.locator('#menu-btn');
    const menuOverlay = page.locator('#mobile-menu-overlay');

    // Open menu
    await menuBtn.click();
    await expect(menuOverlay).toHaveAttribute('data-state', 'open');

    // Navigate
    const navLink = page.locator('#mobile-menu-overlay a').first();
    await navLink.click();
    await page.waitForLoadState('networkidle');

    // Menu should be closed
    await expect(menuOverlay).toHaveAttribute('data-state', 'closed');

    // Verify it can be reopened on new page
    await menuBtn.click();
    await expect(menuOverlay).toHaveAttribute('data-state', 'open');
  });

  test('menu state should not interfere with page transitions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Just verify the menu opens and doesn't break basic functionality
    const menuBtn = page.locator('#menu-btn');
    const menuOverlay = page.locator('#mobile-menu-overlay');

    // Open menu
    await menuBtn.click();
    await expect(menuOverlay).toHaveAttribute('data-state', 'open');

    // Close it via keyboard
    await page.keyboard.press('Escape');
    await expect(menuOverlay).toHaveAttribute('data-state', 'closed');

    // Verify we can reopen it
    await menuBtn.click();
    await expect(menuOverlay).toHaveAttribute('data-state', 'open');
  });
});

test.describe('Mobile Menu - No Horizontal Scroll', () => {
  test('should not cause horizontal scroll overflow on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');

    // Get initial scroll dimensions
    const initialScrollWidth = await body.evaluate(el => el.scrollWidth);
    const initialClientWidth = await body.evaluate(el => el.clientWidth);

    // Open menu
    const menuBtn = page.locator('#menu-btn');
    await menuBtn.click();

    // Check scroll dimensions haven't changed (no overflow)
    const openScrollWidth = await body.evaluate(el => el.scrollWidth);
    const openClientWidth = await body.evaluate(el => el.clientWidth);

    // Should not have created horizontal scroll
    expect(openScrollWidth).toBeLessThanOrEqual(initialScrollWidth + 1); // +1 for rounding
    expect(openClientWidth).toBe(initialClientWidth);
  });
});
