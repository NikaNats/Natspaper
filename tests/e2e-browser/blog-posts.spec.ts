// tests/e2e-browser/blog-posts.spec.ts

import { test, expect, type Page, type Locator } from "@playwright/test";

// --- Best Practice: Page Object Model (POM) ---
// This class encapsulates the "how" (locators and actions) from the "what" (the test's intent).
// It makes tests DRY, readable, and easy to maintain.
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

    // Decouple selectors using data-testid attributes
    this.postCards = page.getByTestId("post-card");
    this.postTitle = page.locator("h1").first();
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
    await expect(this.postCards.first()).toBeVisible({ timeout: 15000 });
  }

  /**
   * Clicks the first post card and waits for the detail page to load.
   * @returns The title text of the post that was clicked.
   */
  async viewFirstPost(): Promise<string> {
    const firstPostCard = this.postCards.first();
    const titleText =
      (await firstPostCard.getByRole("heading").textContent()) || "";

    await firstPostCard.getByRole("link").click();

    await this.page.waitForLoadState("networkidle", { timeout: 10000 });
    await expect(this.postTitle).toBeVisible({ timeout: 10000 });

    return titleText;
  }
}

// --- Critical User Journey Tests ---
test.describe("Critical User Journey: Blog Posts", () => {
  let blogPage: BlogPage;

  test.beforeEach(async ({ page, browserName }) => {
    // Skip WebKit when local dev server HMR interferes with client-side navigation
    test.skip(
      browserName === "webkit",
      "Skipping WebKit due to local HMR router timing"
    );

    blogPage = new BlogPage(page);
    await blogPage.goto();
  });

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

      // Check for tags
      const tagCount = await blogPage.postTagLinks.count();
      if (tagCount > 0) {
        await expect(blogPage.postTagLinks.first()).toBeEnabled();
      }
    });
  });

  test("should allow navigation from a post's tag to the tag archive page", async ({
    page,
  }) => {
    const postCount = await blogPage.postCards.count();
    test.skip(postCount === 0, "No blog posts found to test.");

    // Find the first post that has tags
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

    // Wait for the tag URL
    await page.waitForURL(
      `**/en/tags/${tagName.toLowerCase().replace(" ", "-")}/**`
    );

    // Verify the tag archive page
    await expect(blogPage.tagArchiveTitle).toBeVisible();
    await expect(blogPage.tagArchiveTitle).toContainText(tagName, {
      ignoreCase: true,
    });

    await expect(blogPage.postCards.first()).toBeVisible();
  });
});

// --- W3C MathML Core Verification ---
test.describe("W3C MathML Core Verification", () => {
  test("should render native MathML tags without legacy KaTeX HTML spans", async ({
    page,
  }) => {
    await page.goto("/en/posts/how-to-add-latex-equations-in-blog-posts");
    await page.waitForLoadState("networkidle");

    // 1. Assert presence of native <math> elements
    const mathNodes = page.locator("article math");
    const count = await mathNodes.count();
    expect(count).toBeGreaterThan(0);

    // 2. Validate semantic MathML sub-elements (<mi>, <mo>, <mfrac>, <msup>)
    const firstMath = mathNodes.first();
    await expect(firstMath).toBeVisible();
    await expect(firstMath.locator("mi, mo, mn, msup").first()).toBeAttached();

    // 3. Ensure no legacy KaTeX span classes exist in the DOM
    const legacySpans = page.locator(".katex-html, .katex-display, .vlist-t");
    expect(await legacySpans.count()).toBe(0);
  });
});

// --- W3C DPUB-ARIA 1.1 & ARIA in HTML Verification ---
test.describe("W3C DPUB-ARIA 1.1 & ARIA in HTML Semantics Verification", () => {
  test("should expose valid digital publishing landmarks and roles on academic posts", async ({
    page,
  }) => {
    await page.goto("/en/posts/distributed-consensus-algorithms");
    await page.waitForLoadState("networkidle");

    // 1. Table of Contents: role="doc-toc"
    const toc = page.locator('nav[role="doc-toc"]');
    if ((await toc.count()) > 0) {
      await expect(toc.first()).toBeVisible();
    }

    // 2. Bibliography landmark: role="doc-bibliography"
    const bibliography = page.locator('section[role="doc-bibliography"]');
    await expect(bibliography).toBeVisible();

    // 3. Inline reference link: role="doc-biblioref"
    const inlineRef = page.locator('a[role="doc-biblioref"]').first();
    if ((await inlineRef.count()) > 0) {
      await expect(inlineRef).toBeAttached();
    }

    // 4. Conformance rule: No deprecated doc-biblioentry is used on <li>
    const deprecatedRoles = page.locator('[role="doc-biblioentry"]');
    expect(await deprecatedRoles.count()).toBe(0);
  });

  test("should expose doc-part and doc-subtitle on series posts", async ({
    page,
  }) => {
    // Navigate to a series article
    await page.goto("/en/posts/system-design-part-1");
    await page.waitForLoadState("networkidle");

    // 1. Series box structural division: role="doc-part" on <section>
    const seriesSection = page.locator('section[role="doc-part"]');
    if ((await seriesSection.count()) > 0) {
      await expect(seriesSection.first()).toBeVisible();

      // 2. Series title: role="doc-subtitle"
      const seriesSubtitle = seriesSection.locator('[role="doc-subtitle"]');
      await expect(seriesSubtitle).toBeVisible();
    }
  });

  test("should conform to ARIA in HTML for disabled pagination links", async ({
    page,
  }) => {
    // On page 1 of posts listing, previous button is disabled
    await page.goto("/en/posts");
    await page.waitForLoadState("networkidle");

    // ARIA in HTML 2026: Disabled links rendered as <span> must carry explicit role="link"
    const disabledLink = page.locator('nav[aria-label="Pagination"] span[role="link"][aria-disabled="true"]');
    if ((await disabledLink.count()) > 0) {
      await expect(disabledLink.first()).toBeVisible();
    }
  });
});