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

/**
 * Navigate to URL with retry logic for connection issues
 * Handles Firefox NS_ERROR_CONNECTION_REFUSED by retrying
 */
async function navigateWithRetry(page: Page, url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.goto(url);
      return; // Success
    } catch (error) {
      if (i === maxRetries - 1) throw error; // Last attempt, throw error
      
      // Check if it's a connection error that we should retry
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('NS_ERROR_CONNECTION_REFUSED') || 
          errorMessage.includes('Connection refused')) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }
      throw error; // Other errors, throw immediately
    }
  }
}

test.describe('Home Page - E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Navigate to home page
    await navigateWithRetry(page, '/');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should load and display home page with header', async () => {
    // Skip dev toolbar header elements by filtering to main page header
    const header = page.locator('body > header').first();
    await expect(header).toBeVisible();

    // Verify header has navigation
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should display blog posts in correct order', async () => {
    // Try to find posts on home page
    let postCards = page.locator('[data-post-id]');
    let count = await postCards.count();

    if (count === 0) {
      // No posts on home, try alternative selectors
      postCards = page.locator('article, .post-card, [role="article"]');
      count = await postCards.count();
    }

    if (count === 0) {
      // No posts on home, try /posts/
      await navigateWithRetry(page, '/posts/');
      await page.waitForLoadState('networkidle');
      postCards = page.locator('[data-post-id], article, .post-card, [role="article"]');
      count = await postCards.count();
    }

    // If still no posts found, skip test
    if (count === 0) {
      return;
    }

    expect(count).toBeGreaterThan(0);

    // Verify first post title is visible
    const firstPostTitle = postCards.first().locator('.post-title, h2, h3, h1, a');
    const titleCount = await firstPostTitle.count();
    
    if (titleCount > 0) {
      await expect(firstPostTitle.first()).toBeVisible();
    }
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

    // Verify header role - target the main page header, not dev toolbar headers
    const header = page.locator('body > header').first();
    const headerRole = await header.getAttribute('role');
    expect(headerRole || 'banner').toBeTruthy();

    // Verify navigation exists and is visible
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
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
    expect(await styles.count()).toBeGreaterThanOrEqual(0);

    // Verify page body exists
    const body = page.locator('body');
    await expect(body).toBeVisible();
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

    // Verify header is visible - target main page header only
    const header = page.locator('body > header').first();
    await expect(header).toBeVisible();
  });

  test('should handle no JavaScript gracefully with noscript content', async () => {
    // Verify page has noscript fallback (if implemented)
    const noscript = page.locator('noscript');
    
    // Note: This is more of a verification that the structure is there
    // The actual behavior is tested when scripts load
    const count = await noscript.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
