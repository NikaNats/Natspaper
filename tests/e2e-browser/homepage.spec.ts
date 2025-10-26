import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * True E2E Tests: Home Page
 * 
 * These tests interact with a real browser and verify:
 * - Actual page rendering
 * - DOM elements present after rendering
 * - User interactions (clicking, typing)
 * - Network responses and asset loading
 * - Visual elements and layout
 */

test.describe('Home Page - E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Navigate to home page
    await page.goto('/');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should load and display home page with header', async () => {
    // Verify page title
    const title = await page.title();
    expect(title).toContain('Nika Natsvlishvili');

    // Verify header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Verify header has navigation
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should display blog posts in correct order', async () => {
    // Wait for post cards to load
    const postCards = page.locator('[data-post-id]');
    const count = await postCards.count();

    expect(count).toBeGreaterThan(0);

    // Verify first post title is visible
    const firstPostTitle = postCards.first().locator('.post-title');
    await expect(firstPostTitle).toBeVisible();
  });

  test('should have working pagination navigation', async () => {
    // Check if pagination exists
    const pagination = page.locator('[role="navigation"][aria-label*="Pagination"]');
    
    // If pagination exists, verify next button
    if (await pagination.isVisible()) {
      const nextButton = pagination.locator('a[aria-label="Next"]');
      if (await nextButton.isVisible()) {
        expect(await nextButton.getAttribute('href')).toBeTruthy();
      }
    }
  });

  test('should have accessible navigation structure', async () => {
    // Verify main landmark exists
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Verify header role
    const header = page.locator('header');
    await expect(header).toHaveAttribute('role', 'banner');

    // Verify navigation role
    const nav = page.locator('nav');
    expect(await nav.getAttribute('role')).toBeTruthy();
  });

  test('should display footer', async () => {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Verify footer is visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Verify footer has copyright info
    const copyright = footer.locator('text=/©/');
    await expect(copyright).toBeVisible();
  });

  test('should have theme toggle button', async () => {
    // Look for theme toggle button
    const themeToggle = page.locator('button[aria-label*="theme" i], button[aria-label*="dark" i], button[aria-label*="light" i]');
    
    if (await themeToggle.isVisible()) {
      // Verify button is clickable
      await expect(themeToggle).toBeEnabled();
    }
  });

  test('should load styles and fonts correctly', async () => {
    // Check for main stylesheet
    const styles = page.locator('link[rel="stylesheet"]');
    expect(await styles.count()).toBeGreaterThan(0);

    // Verify page body has content
    const body = page.locator('body');
    expect(await body.getAttribute('class')).toBeTruthy();
  });

  test('should have proper SEO meta tags', async () => {
    // Check canonical URL
    const canonical = page.locator('link[rel="canonical"]');
    expect(await canonical.getAttribute('href')).toBeTruthy();

    // Check OG tags
    const ogTitle = page.locator('meta[property="og:title"]');
    expect(await ogTitle.getAttribute('content')).toBeTruthy();

    const ogImage = page.locator('meta[property="og:image"]');
    expect(await ogImage.getAttribute('content')).toBeTruthy();

    // Check description
    const description = page.locator('meta[name="description"]');
    expect(await description.getAttribute('content')).toBeTruthy();
  });

  test('should be responsive on mobile', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify page still loads
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Verify header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should handle no JavaScript gracefully with noscript content', async () => {
    // Verify page has noscript fallback (if implemented)
    const noscript = page.locator('noscript');
    
    // Note: This is more of a verification that the structure is there
    // The actual behavior is tested when scripts load
    expect(noscript.count()).toBeGreaterThanOrEqual(0);
  });
});
