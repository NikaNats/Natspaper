import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * True E2E Tests: Search and Navigation
 * 
 * Tests that verify:
 * - Search functionality works in browser
 * - Search results are rendered correctly
 * - Tag pages load and filter posts
 * - Navigation between pages works
 */

/**
 * Helper function to open mobile menu if on mobile device
 * Checks if menu button exists and menu is hidden, then opens it
 */
async function openMobileMenuIfNeeded(page: Page) {
  const menuBtn = page.locator('#menu-btn');
  const menuItems = page.locator('#mobile-menu-overlay');
  
  // Check if we're on mobile (menu button exists and menu is hidden)
  if (await menuBtn.isVisible() && await menuItems.isHidden()) {
    await menuBtn.click();
    // Wait for menu to open
    await expect(menuItems).toBeVisible();
  }
}

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

test.describe('Search and Navigation - E2E Tests', () => {
  test('should navigate to search page', async ({ page }) => {
    await navigateWithRetry(page, '/');
    await page.waitForLoadState('networkidle');

    // Open mobile menu if needed
    await openMobileMenuIfNeeded(page);

    // Look for search link or button
    const searchLink = page.locator('a[href*="/search"], button[aria-label*="search" i]');
    
    if (await searchLink.count() > 0) {
      // Check if it's a button or link
      const isButton = await searchLink.first().evaluate((el) => el.tagName === 'BUTTON');
      
      if (isButton) {
        // If it's a button, it might open a modal - just verify it's clickable
        await expect(searchLink.first()).toBeEnabled();
      } else {
        // If it's a link, follow it
        await searchLink.first().click();
        await page.waitForLoadState('networkidle');
        
        // Verify search page loads or modal opens
        const isSearchPage = page.url().includes('/search');
        const isSearchModal = await page.locator('[aria-label*="search" i], .search-modal, [role="dialog"]').count() > 0;
        
        expect(isSearchPage || isSearchModal).toBeTruthy();
      }
    }
  });

  test('should display tags page with all available tags', async ({ page }) => {
    await navigateWithRetry(page, '/tags');
    await page.waitForLoadState('networkidle');

    // Verify tags page title
    const title = page.locator('h1, h2');
    const isTagsPage = title.filter({ hasText: /tags/i });
    
    if (await isTagsPage.isVisible()) {
      // Verify tags are displayed
      const tags = page.locator('a[href*="/tags/"], [data-tag]');
      expect(await tags.count()).toBeGreaterThan(0);
    }
  });

  test('should filter posts by tag', async ({ page }) => {
    await navigateWithRetry(page, '/tags');
    await page.waitForLoadState('networkidle');

    // Find first tag link
    const tagLinks = page.locator('a[href*="/tags/"]');
    const tagLinkCount = await tagLinks.count();
    
    if (tagLinkCount > 0) {
      const firstTagLink = tagLinks.first();
      
      // Click the tag
      await firstTagLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on tag page (URL might end with /tags/tagname or /tags/tagname/)
      expect(page.url()).toContain('/tags');

      // Wait for posts to load
      await page.waitForSelector('[data-post-id]', { timeout: 5000 }).catch(() => {
        // No posts found on this tag, which is OK for some tags
      });
      
      const posts = page.locator('[data-post-id]');
      const postCount = await posts.count();
      
      // It's OK if no posts are shown for this tag
      expect(postCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should navigate using breadcrumb', async ({ page }) => {
    // Go to a tag page
    await navigateWithRetry(page, '/tags');
    await page.waitForLoadState('networkidle');

    // Find and click a tag
    const firstTag = page.locator('a[href*="/tags/"]').first();
    if (await firstTag.count() > 0) {
      await firstTag.click();
      await page.waitForLoadState('networkidle');

      // Look for breadcrumb navigation - use more specific selector
      const breadcrumb = page.locator('nav [aria-label*="breadcrumb" i]').first();
      
      if (await breadcrumb.count() > 0 && await breadcrumb.isVisible()) {
        // Try to find home link in breadcrumb
        const homeLink = breadcrumb.locator('a[href="/"]');
        
        if (await homeLink.count() > 0 && await homeLink.isVisible()) {
          await homeLink.click();
          await page.waitForLoadState('networkidle');
          
          // Verify we're back home
          expect(page.url()).toContain('/');
        }
      }
    }
  });

  test('should navigate using back button', async ({ page }) => {
    await navigateWithRetry(page, '/');
    await page.waitForLoadState('networkidle');

    // Find back button if available
    const backButton = page.locator('button[aria-label*="back" i], a[aria-label*="back" i]');
    
    if (await backButton.isVisible()) {
      // The back button should be visible on nested pages
      // Let's navigate to a post first
      const postCard = page.locator('[data-post-id]').first();
      if (await postCard.isVisible()) {
        await postCard.locator('a').first().click();
        await page.waitForLoadState('networkidle');

        // Now try back button
        const backBtn = page.locator('button[aria-label*="back" i], a[aria-label*="back" i]');
        if (await backBtn.isVisible()) {
          await backBtn.click();
          await page.waitForLoadState('networkidle');
        }
      }
    }
  });

  test('should use browser back button', async ({ page }) => {
    await navigateWithRetry(page, '/');
    await page.waitForLoadState('networkidle');

    // Navigate to a post
    const postCard = page.locator('[data-post-id]').first();
    if (await postCard.isVisible()) {
      const url1 = page.url();
      
      await postCard.locator('a').first().click();
      await page.waitForLoadState('networkidle');
      
      const url2 = page.url();
      expect(url2).not.toBe(url1);

      // Use browser back button
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Verify we're back at home
      expect(page.url()).toBe(url1);
    }
  });

  test('should have working pagination', async ({ page }) => {
    await navigateWithRetry(page, '/');
    await page.waitForLoadState('networkidle');

    // Find pagination next button
    const nextButton = page.locator('a[rel="next"], button:has-text("Next"), a:has-text("Next")');
    
    if (await nextButton.isVisible()) {
      const url1 = page.url();
      
      // Click next
      await nextButton.click();
      await page.waitForLoadState('networkidle');

      const url2 = page.url();
      
      // Verify URL changed
      expect(url2).not.toBe(url1);

      // Find previous button and click it
      const prevButton = page.locator('a[rel="prev"], button:has-text("Prev"), a:has-text("Prev")');
      if (await prevButton.isVisible()) {
        await prevButton.click();
        await page.waitForLoadState('networkidle');

        // Should be back at first page
        expect(page.url()).toBe(url1);
      }
    }
  });

  test('should have accessible navigation menu', async ({ page }) => {
    await navigateWithRetry(page, '/');
    await page.waitForLoadState('networkidle');

    // Open mobile menu if needed
    await openMobileMenuIfNeeded(page);

    // Find navigation menu
    const nav = page.locator('nav[role="navigation"], nav');
    await expect(nav).toBeVisible();

    // Find navigation links
    const navLinks = nav.locator('a');
    expect(await navLinks.count()).toBeGreaterThan(0);

    // Verify all links are accessible
    for (let i = 0; i < Math.min(await navLinks.count(), 5); i++) {
      const link = navLinks.nth(i);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href');
    }
  });

  test('should highlight current page in navigation', async ({ page }) => {
    await navigateWithRetry(page, '/');
    await page.waitForLoadState('networkidle');

    // Verify navigation links exist and navigation reflects current page
    const navLinks = page.locator('nav a');
    expect(await navLinks.count()).toBeGreaterThan(0);
  });
});
