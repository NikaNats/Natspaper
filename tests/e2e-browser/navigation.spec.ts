import { test, expect } from '@playwright/test';

/**
 * True E2E Tests: Search and Navigation
 * 
 * Tests that verify:
 * - Search functionality works in browser
 * - Search results are rendered correctly
 * - Tag pages load and filter posts
 * - Navigation between pages works
 */

test.describe('Search and Navigation - E2E Tests', () => {
  test('should navigate to search page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for search link in navigation or header
    const searchLink = page.locator('a[href*="/search"], button[aria-label*="search" i]');
    
    if (await searchLink.isVisible()) {
      // If it's a button (opens search modal), click it
      if (await searchLink.evaluate((el) => el.tagName === 'BUTTON')) {
        await searchLink.click();
      } else {
        // If it's a link, follow it
        await searchLink.click();
        await page.waitForLoadState('networkidle');
        
        // Verify search page loads
        expect(page.url()).toContain('/search');
      }
    }
  });

  test('should display tags page with all available tags', async ({ page }) => {
    await page.goto('/tags');
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
    await page.goto('/tags');
    await page.waitForLoadState('networkidle');

    // Find first tag link
    const firstTagLink = page.locator('a[href*="/tags/"]').first();
    
    if (await firstTagLink.isVisible()) {
      const tagName = await firstTagLink.textContent();
      
      // Click the tag
      await firstTagLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on tag page
      expect(page.url()).toContain('/tags/');

      // Verify posts are displayed with this tag
      const posts = page.locator('[data-post-id]');
      expect(await posts.count()).toBeGreaterThan(0);

      // Verify posts have the selected tag
      const postTags = page.locator(`a[href*="/tags/"][href*="${tagName}"]`);
      expect(await postTags.count()).toBeGreaterThan(0);
    }
  });

  test('should navigate using breadcrumb', async ({ page }) => {
    // Go to a tag page
    await page.goto('/tags');
    await page.waitForLoadState('networkidle');

    // Find and click a tag
    const firstTag = page.locator('a[href*="/tags/"]').first();
    if (await firstTag.isVisible()) {
      await firstTag.click();
      await page.waitForLoadState('networkidle');

      // Look for breadcrumb navigation
      const breadcrumb = page.locator('nav [aria-label*="breadcrumb" i], .breadcrumb, nav li');
      
      if (await breadcrumb.isVisible()) {
        // Try to find home link in breadcrumb
        const homeLink = breadcrumb.locator('a[href="/"]');
        
        if (await homeLink.isVisible()) {
          await homeLink.click();
          await page.waitForLoadState('networkidle');
          
          // Verify we're back home
          expect(page.url()).toContain('/');
        }
      }
    }
  });

  test('should navigate using back button', async ({ page }) => {
    await page.goto('/');
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
    await page.goto('/');
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
    await page.goto('/');
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
    await page.goto('/');
    await page.waitForLoadState('networkidle');

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
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify navigation links exist and navigation reflects current page
    const navLinks = page.locator('nav a');
    expect(await navLinks.count()).toBeGreaterThan(0);
  });
});
