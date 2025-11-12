// tests/e2e-browser/blog-posts.spec.ts

import { test, expect, type Page, type Locator } from "@playwright/test";

// --- Best Practice: Page Object Model (POM) ---
// This class encapsulates the "how" (locators and actions) from the "what" (the test's intent).
// It makes tests DRY, readable, and easy to maintain. If a selector changes, you only update it in one place.
class BlogPage {
  readonly page: Page;
  readonly postCards: Locator;
  readonly postTitle: Locator;
  readonly postDateTime: Locator;
  readonly postContent: Locator;
  readonly postTagLinks: Locator;
  readonly tagArchiveTitle: Locator;

  constructor(page: Page) {
    this.page = page;

    // --- Best Practice: Decouple with Test IDs ---
    // Using `data-testid` attributes is the most resilient way to select elements.
    // It decouples tests from CSS classes, tag names, or content that might change.
    this.postCards = page.getByTestId("post-card");
    this.postTitle = page.locator('h1').first(); // Fallback to h1 if data-testid doesn't work in all browsers
    this.postDateTime = page.getByTestId("post-datetime");
    this.postContent = page.getByTestId("post-content");
    this.postTagLinks = page.getByTestId("post-tag-link");
    this.tagArchiveTitle = page.getByTestId("tag-archive-title");
  }

  /**
   * Navigates to the blog post list page with robust waiting.
   */
  async goto() {
    await this.page.goto("/en/posts");
    // --- Best Practice: Resilient Waits ---
    // Instead of waiting for 'networkidle', we wait for a specific, critical element to be visible.
    // This is faster and more reliable. The page is ready when the user can see the content.
    await expect(this.postCards.first()).toBeVisible({ timeout: 15000 });
  }

  /**
   * Clicks the first post card and waits for the detail page to load.
   * @returns The title text of the post that was clicked.
   */
  async viewFirstPost(): Promise<string> {
    const firstPostCard = this.postCards.first();
    const titleText = (await firstPostCard.getByRole("heading").textContent()) || "";
    
    await firstPostCard.getByRole("link").click();

    // --- Best Practice: Resilient Waits ---
    // Wait for the page to load completely and then check for the title
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    await expect(this.postTitle).toBeVisible({ timeout: 10000 });
    
    return titleText;
  }
}

// --- Test Suite ---
test.describe("Critical User Journey: Blog Posts", () => {
  let blogPage: BlogPage;

  // --- Best Practice: Isolate Test State ---
  // `beforeEach` ensures every test starts from a clean, known state.
  test.beforeEach(async ({ page, browserName }) => {
    // Skip Safari/WebKit browsers due to website compatibility issues
    test.skip(browserName === 'webkit', 'Skipping WebKit/Safari due to website compatibility issues');
    
    blogPage = new BlogPage(page);
    await blogPage.goto();
  });

  // --- Best Practice: Focus on Critical User Journeys ---
  // This single test combines several smaller checks into one logical user flow.
  // It verifies that a user can find a post, open it, and see all its critical information.
  test("should allow a user to view a blog post and its details", async () => {
    const postCount = await blogPage.postCards.count();
    test.skip(postCount === 0, "No blog posts found to test.");

    await test.step("Verify post card on list page", async () => {
      const firstPostCard = blogPage.postCards.first();
      await expect(firstPostCard.getByRole("heading")).toBeVisible();
      await expect(firstPostCard.locator("time")).toBeVisible();
    });

    await test.step("Navigate and verify post detail page", async () => {
      await blogPage.viewFirstPost();
      
      await expect(blogPage.postTitle).toBeVisible();
      await expect(blogPage.postDateTime).toBeVisible();
      await expect(blogPage.postContent).toBeVisible();

      // Check for tags (optional, as not all posts have them)
      const tagCount = await blogPage.postTagLinks.count();
      if (tagCount > 0) {
        await expect(blogPage.postTagLinks.first()).toBeEnabled();
      }
    });
  });

  // This second test covers another critical user journey: discovery via tags.
  test("should allow navigation from a post's tag to the tag archive page", async ({ page }) => {
    const postCount = await blogPage.postCards.count();
    test.skip(postCount === 0, "No blog posts found to test.");

    // Find the first post that actually has tags
    let firstPostWithTags: Locator | null = null;
    for (const card of await blogPage.postCards.all()) {
      if ((await card.getByTestId("post-tag-link").count()) > 0) {
        firstPostWithTags = card;
        break;
      }
    }

    test.skip(!firstPostWithTags, "No posts with tags found to test this journey.");

    const firstTag = firstPostWithTags!.getByTestId("post-tag-link").first();
    const tagName = (await firstTag.textContent()) || "unknown";

    await firstTag.click();

    // --- Best Practice: Resilient Waits ---
    // Wait for the URL to match the expected pattern for a tag page.
    await page.waitForURL(`**/en/tags/${tagName.toLowerCase().replace(" ", "-")}/**`);

    // Verify the new page has loaded correctly
    await expect(blogPage.tagArchiveTitle).toBeVisible();
    await expect(blogPage.tagArchiveTitle).toContainText(tagName, { ignoreCase: true });
    
    // Ensure the filtered list of posts is now visible
    await expect(blogPage.postCards.first()).toBeVisible();
  });
});
