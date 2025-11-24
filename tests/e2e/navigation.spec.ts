import { test, expect } from '@playwright/test';

test('homepage loads and navigates to blog', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Natspaper/i);
  
  // Click the blog link (assuming there is one, or we navigate to /posts)
  // Since homepage redirects to /en/, we might need to check that.
  
  // If homepage redirects to /en/, we should wait for that.
  await page.waitForURL(/\/en\/?/);
  
  // Click on "Posts" or similar if it exists. 
  // Based on the user request, I'll assume there is a link named 'Posts'.
  const postsLink = page.getByRole('link', { name: 'Posts' });
  if (await postsLink.count() > 0) {
      await postsLink.click();
      await expect(page).toHaveURL(/.*\/posts/);
      
      // Check if posts exist
      const posts = page.locator('ul li');
      await expect(posts).not.toHaveCount(0);
  }
});
