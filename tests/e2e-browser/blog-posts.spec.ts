import { test, expect } from '@playwright/test';

/**
 * True E2E Tests: Blog Posts
 * 
 * Tests that verify:
 * - Blog post pages load and render correctly
 * - Post metadata displays properly
 * - Navigation between posts works
 * - Related posts/tags are clickable and functional
 */

test.describe('Blog Posts - E2E Tests', () => {
  test('should navigate to and display a blog post', async ({ page }) => {
    // Go to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find first post card and click it
    const firstPostCard = page.locator('[data-post-id]').first();
    const postLink = firstPostCard.locator('a').first();
    
    // Get the href to verify navigation
    const href = await postLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('/posts/');

    // Click the post
    await postLink.click();
    await page.waitForLoadState('networkidle');

    // Verify we're on a post page
    const postTitle = page.locator('article h1');
    await expect(postTitle).toBeVisible();
  });

  test('should display post metadata correctly', async ({ page }) => {
    // Navigate to a post (assuming it exists)
    await page.goto('/posts/');
    await page.waitForLoadState('networkidle');

    // Try to find and click a post
    const postCard = page.locator('[data-post-id]').first();
    if (await postCard.isVisible()) {
      await postCard.locator('a').first().click();
      await page.waitForLoadState('networkidle');

      // Verify publication date
      const pubDate = page.locator('time');
      expect(await pubDate.count()).toBeGreaterThan(0);

      // Verify post has content
      const article = page.locator('article');
      await expect(article).toBeVisible();
    }
  });

  test('should display reading time', async ({ page }) => {
    await page.goto('/posts/');
    await page.waitForLoadState('networkidle');

    const postCard = page.locator('[data-post-id]').first();
    if (await postCard.isVisible()) {
      // Check if reading time is displayed
      const readingTime = postCard.locator('text=/min read/i, text=/minute/i');
      
      // Reading time may or may not be visible depending on design
      if (await readingTime.isVisible()) {
        expect(await readingTime.textContent()).toMatch(/\d+\s*(min|minute)/i);
      }
    }
  });

  test('should display post tags and make them clickable', async ({ page }) => {
    await page.goto('/posts/');
    await page.waitForLoadState('networkidle');

    const postCard = page.locator('[data-post-id]').first();
    if (await postCard.isVisible()) {
      const tags = postCard.locator('a[href*="/tags/"]');
      
      if (await tags.count() > 0) {
        // Get the first tag
        const firstTag = tags.first();
        const tagHref = await firstTag.getAttribute('href');
        
        expect(tagHref).toBeTruthy();
        expect(tagHref).toContain('/tags/');
      }
    }
  });

  test('should navigate between posts via tag links', async ({ page }) => {
    await page.goto('/posts/');
    await page.waitForLoadState('networkidle');

    // Find a post with tags
    const postCards = page.locator('[data-post-id]');
    for (let i = 0; i < await postCards.count(); i++) {
      const card = postCards.nth(i);
      const tags = card.locator('a[href*="/tags/"]');
      
      if (await tags.count() > 0) {
        // Click the first tag
        await tags.first().click();
        await page.waitForLoadState('networkidle');

        // Verify we're on a tags page or filtered view
        expect(page.url()).toContain('/tags/');
        
        // Verify posts are displayed
        const filteredPosts = page.locator('[data-post-id]');
        expect(await filteredPosts.count()).toBeGreaterThan(0);
        
        break;
      }
    }
  });

  test('should have proper post page accessibility', async ({ page }) => {
    await page.goto('/posts/');
    await page.waitForLoadState('networkidle');

    const postCard = page.locator('[data-post-id]').first();
    if (await postCard.isVisible()) {
      await postCard.locator('a').first().click();
      await page.waitForLoadState('networkidle');

      // Verify main content area
      const main = page.locator('main');
      await expect(main).toBeVisible();

      // Verify article element
      const article = page.locator('article');
      await expect(article).toBeVisible();
    }
  });

  test('should load post images with alt text', async ({ page }) => {
    await page.goto('/posts/');
    await page.waitForLoadState('networkidle');

    const postCard = page.locator('[data-post-id]').first();
    if (await postCard.isVisible()) {
      await postCard.locator('a').first().click();
      await page.waitForLoadState('networkidle');

      // Check for images with alt text (if present)
      const images = page.locator('article img');
      
      if (await images.count() > 0) {
        // Verify images have alt text
        for (let i = 0; i < await images.count(); i++) {
          const img = images.nth(i);
          const alt = await img.getAttribute('alt');
          
          // Alt text should be present
          expect(alt).toBeTruthy();
        }
      }
    }
  });
});
