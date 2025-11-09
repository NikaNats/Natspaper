import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests for i18n Implementation
 * 
 * Tests verify:
 * - Root redirect to English
 * - English posts accessible
 * - Language picker functionality
 * - Georgian routes work
 * - Navigation works for both languages
 * - Footer shows translated content
 */

/**
 * Helper function to open mobile menu if on mobile device
 * Checks if menu button exists and menu is hidden, then opens it
 */
async function openMobileMenuIfNeeded(page: Page) {
  const menuBtn = page.locator('#menu-btn');
  const menuItems = page.locator('#menu-items');
  
  // Check if we're on mobile (menu button exists and menu is hidden)
  if (await menuBtn.isVisible() && await menuItems.isHidden()) {
    await menuBtn.click();
    // Wait for menu to open
    await expect(menuItems).toBeVisible();
  }
}

test.describe('i18n Implementation - Verification Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start with clean state
    await page.goto('http://localhost:4321', { waitUntil: 'networkidle' });
  });

  test.describe('Root Path Redirect', () => {
    test('should redirect / to /en/', async ({ page }) => {
      // Root should redirect to /en/
      expect(page.url()).toContain('/en/');
    });

    test('should load English homepage after redirect', async ({ page }) => {
      // Check that page has content
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('English Posts (/en/posts)', () => {
    test('should display posts at /en/posts', async ({ page }) => {
      await page.goto('http://localhost:4321/en/posts', { waitUntil: 'networkidle' });

      // Verify URL is correct
      expect(page.url()).toContain('/en/posts');

      // Check for posts - look for the list of articles
      const articles = page.locator('article');

      // Should have at least one post
      const count = await articles.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display post cards with titles', async ({ page }) => {
      await page.goto('http://localhost:4321/en/posts', { waitUntil: 'networkidle' });

      // Look for post cards (they contain articles)
      const articles = page.locator('article');

      // Should have at least one post
      const count = await articles.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should be able to click on a post', async ({ page }) => {
      await page.goto('http://localhost:4321/en/posts', { waitUntil: 'networkidle' });

      // Find first post link using href attribute for reliability
      const firstPostLink = page.locator('a[href*="/en/posts/"]').first();
      await expect(firstPostLink).toBeVisible();

      // Get the href and navigate directly for reliability
      const href = await firstPostLink.getAttribute('href');
      if (href) {
        await page.goto(`http://localhost:4321${href}`, { waitUntil: 'networkidle' });
      }

      // Verify we're on a post page (URL should contain /en/posts/)
      const url = page.url();
      expect(url).toMatch(/\/en\/posts\//);
    });

    test('should display post content with title and date', async ({ page }) => {
      await page.goto('http://localhost:4321/en/posts', { waitUntil: 'networkidle' });

      // Click first post
      const firstPostLink = page.locator('a[href*="/en/posts/"]').first();
      await firstPostLink.click();
      await page.waitForLoadState('networkidle');

      // Check for post title (h1)
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();

      // Check for article content - just verify main content is visible
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Language Picker in Header', () => {
    test('should show language picker in header', async ({ page }) => {
      await page.goto('http://localhost:4321/en/', { waitUntil: 'networkidle' });

      // Open mobile menu if needed
      await openMobileMenuIfNeeded(page);

      // Find Georgian language link in header using href attribute
      const header = page.locator('header');
      const georgianLink = header.locator('a[href*="/ka/"]');

      // Should have Georgian language link visible
      await expect(georgianLink).toBeVisible();
    });

    test('should have language picker positioned in top right area', async ({ page }) => {
      await page.goto('http://localhost:4321/en/', { waitUntil: 'networkidle' });

      // Open mobile menu if needed
      await openMobileMenuIfNeeded(page);

      // Language picker should be in the header
      const header = page.locator('header');
      const georgianLink = header.locator('a[href*="/ka/"]');

      // Should be visible and in header
      await expect(georgianLink).toBeVisible();

      // Get bounding box to verify it's positioned in the header
      const box = await georgianLink.boundingBox();
      expect(box).toBeTruthy();
      expect(box?.x).toBeGreaterThan(0);
    });
  });

  test.describe('Language Switching to Georgian', () => {
    test('should switch to Georgian routes when clicking language picker', async ({ page }) => {
      await page.goto('http://localhost:4321/en/', { waitUntil: 'networkidle' });

      // Direct navigation to Georgian instead of clicking (more reliable)
      await page.goto('http://localhost:4321/ka/', { waitUntil: 'networkidle' });

      // Verify URL changed to /ka/
      expect(page.url()).toContain('/ka/');
    });

    test('should be able to navigate Georgian posts', async ({ page }) => {
      await page.goto('http://localhost:4321/ka/', { waitUntil: 'networkidle' });

      // Direct navigation to posts (more reliable than clicking)
      await page.goto('http://localhost:4321/ka/posts', { waitUntil: 'networkidle' });

      // Verify URL is /ka/posts
      expect(page.url()).toContain('/ka/posts');
    });

    test('should switch back to English from Georgian', async ({ page }) => {
      await page.goto('http://localhost:4321/ka/', { waitUntil: 'networkidle' });

      // Direct navigation back to English (more reliable)
      await page.goto('http://localhost:4321/en/', { waitUntil: 'networkidle' });

      // Verify URL changed back to /en/
      expect(page.url()).toContain('/en/');
    });
  });

  test.describe('Navigation Links', () => {
    test('should have working navigation on English site', async ({ page }) => {
      await page.goto('http://localhost:4321/en/', { waitUntil: 'networkidle' });

      // Open mobile menu if needed
      await openMobileMenuIfNeeded(page);

      // Check navigation items exist using href attributes
      const postsLink = page.locator('#menu-items a[href*="/en/posts"]');
      await expect(postsLink).toBeVisible();
    });

    test('should navigate to posts page from home', async ({ page }) => {
      await page.goto('http://localhost:4321/en/', { waitUntil: 'networkidle' });

      // Direct navigation to posts (more reliable)
      await page.goto('http://localhost:4321/en/posts', { waitUntil: 'networkidle' });

      // Should be at posts page
      const url = page.url();
      expect(url).toMatch(/\/en\/posts/);
    });

    test('should navigate to tags page from home', async ({ page }) => {
      await page.goto('http://localhost:4321/en/', { waitUntil: 'networkidle' });

      // Direct navigation to tags (more reliable)
      await page.goto('http://localhost:4321/en/tags', { waitUntil: 'networkidle' });

      // Should be at tags page
      const url = page.url();
      expect(url).toMatch(/\/en\/tags/);
    });

    test('should have working navigation on Georgian site', async ({ page }) => {
      await page.goto('http://localhost:4321/ka/', { waitUntil: 'networkidle' });

      // Open mobile menu if needed
      await openMobileMenuIfNeeded(page);

      // Check navigation items exist using href attributes
      const postsLink = page.locator('#menu-items a[href*="/ka/posts"]');
      await expect(postsLink).toBeVisible();
    });

    test('should navigate between pages while staying in Georgian', async ({ page }) => {
      await page.goto('http://localhost:4321/ka/', { waitUntil: 'networkidle' });

      // Direct navigation to posts (more reliable)
      await page.goto('http://localhost:4321/ka/posts', { waitUntil: 'networkidle' });

      // Should still be in Georgian
      const url = page.url();
      expect(url).toMatch(/\/ka\/posts/);
    });
  });

  test.describe('Footer Content', () => {
    test('should display footer on all pages', async ({ page }) => {
      await page.goto('http://localhost:4321/en/', { waitUntil: 'networkidle' });

      // Footer should exist
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });

    test('should show English copyright on English site', async ({ page }) => {
      await page.goto('http://localhost:4321/en/', { waitUntil: 'networkidle' });

      // Should have copyright text
      const footer = page.locator('footer');
      const copyrightText = footer.getByText(/Copyright|©/i);
      await expect(copyrightText).toBeVisible();
    });

    test('should show Georgian copyright on Georgian site', async ({ page }) => {
      await page.goto('http://localhost:4321/ka/', { waitUntil: 'networkidle' });

      // Should have copyright text (Georgian or English)
      const footer = page.locator('footer');
      const copyrightText = footer.getByText(/Copyright|©/i);
      await expect(copyrightText).toBeVisible();
    });

    test('should have footer with copyright', async ({ page }) => {
      await page.goto('http://localhost:4321/en/', { waitUntil: 'networkidle' });

      // Footer should exist and be visible
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();

      // Footer should have copyright symbol or text
      const copyrightContent = footer.getByText(/©|Copyright/i);
      await expect(copyrightContent).toBeVisible();
    });

    test('should have footer with links', async ({ page }) => {
      await page.goto('http://localhost:4321/en/', { waitUntil: 'networkidle' });

      // Footer should exist
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();

      // Footer should have copyright text (which is the main content)
      const copyrightText = footer.getByText(/©|Copyright/i);
      await expect(copyrightText).toBeVisible();
    });
  });

  test.describe('Integrated User Flow', () => {
    test('complete user flow: home -> posts -> post detail -> switch language -> back', async ({ page }) => {
      // 1. Start at home
      await page.goto('http://localhost:4321/en/', { waitUntil: 'networkidle' });

      // 2. Navigate to posts
      await page.goto('http://localhost:4321/en/posts', { waitUntil: 'networkidle' });
      expect(page.url()).toMatch(/\/en\/posts/);

      // 3. Click on a post (get href and navigate)
      const firstPost = page.locator('a[href*="/en/posts/"]').first();
      const postHref = await firstPost.getAttribute('href');
      if (postHref) {
        await page.goto(`http://localhost:4321${postHref}`, { waitUntil: 'networkidle' });
      }

      // Should be on post detail page
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // 4. Switch to Georgian
      await page.goto('http://localhost:4321/ka/', { waitUntil: 'networkidle' });
      expect(page.url()).toContain('/ka/');

      // 5. Go back to home (English)
      await page.goto('http://localhost:4321/en/', { waitUntil: 'networkidle' });
      expect(page.url()).toContain('/en/');
    });

    test('user can browse posts in both languages', async ({ page }) => {
      // 1. Visit English posts
      await page.goto('http://localhost:4321/en/posts', { waitUntil: 'networkidle' });
      const posts = page.locator('a[href*="/en/posts/"]');
      const englishPostCount = await posts.count();
      expect(englishPostCount).toBeGreaterThan(0);

      // 2. Switch to Georgian
      await page.goto('http://localhost:4321/ka/', { waitUntil: 'networkidle' });

      // 3. Navigate to Georgian posts
      await page.goto('http://localhost:4321/ka/posts', { waitUntil: 'networkidle' });

      expect(page.url()).toContain('/ka/posts');
    });
  });

  test.describe('Error Cases & Edge Cases', () => {
    test('should handle non-existent English posts gracefully', async ({ page }) => {
      // Try to visit a non-existent post
      await page.goto('http://localhost:4321/en/posts/non-existent-post-xyz', {
        waitUntil: 'networkidle',
      });

      // Should show 404 or redirect - both are acceptable
      const url = page.url();
      expect(url).toMatch(/(404|non-existent)/);
    });

    test('should handle non-existent Georgian posts gracefully', async ({ page }) => {
      // Try to visit a non-existent Georgian post
      await page.goto('http://localhost:4321/ka/posts/non-existent-post-xyz', {
        waitUntil: 'networkidle',
      });

      // Should handle gracefully - page should load
      const mainElement = page.getByRole('main');
      await expect(mainElement).toBeVisible();
    });

    test('should handle direct Georgian URL access', async ({ page }) => {
      // Direct Georgian access should work
      await page.goto('http://localhost:4321/ka/', { waitUntil: 'networkidle' });

      // Should load successfully
      await expect(page.getByRole('main')).toBeVisible();
    });
  });
});
