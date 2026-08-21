import { describe, it, expect } from "vitest";
import { getPostSlug, getPostUrl } from "@/utils/post/postUrl";

describe("postUrl", () => {
  describe("getPostSlug()", () => {
    it("strips the locale prefix from a glob-loader entry ID", () => {
      expect(getPostSlug("en/system-design-part-1")).toBe(
        "system-design-part-1"
      );
      expect(getPostSlug("ka/ჩემი-პოსტი")).toBe("ჩემი-პოსტი");
    });

    it("returns bare slugs unchanged", () => {
      expect(getPostSlug("my-post")).toBe("my-post");
    });

    it("returns only the last segment for nested paths", () => {
      expect(getPostSlug("en/posts/my-article")).toBe("my-article");
    });

    it("strips trailing markdown extensions defensively", () => {
      expect(getPostSlug("en/my-post.md")).toBe("my-post");
      expect(getPostSlug("en/my-post.mdx")).toBe("my-post");
    });

    it("handles empty and undefined input", () => {
      expect(getPostSlug(undefined)).toBe("");
      expect(getPostSlug("")).toBe("");
    });
  });

  describe("getPostUrl()", () => {
    it("builds correct URLs from locale-prefixed entry IDs (regression: double locale prefix)", () => {
      // Regression guard for the featured-card bug on locale homepages,
      // where `/${locale}/posts/${id}` produced "/en/posts/en/my-post" → 404.
      expect(getPostUrl("en", "en/system-design-part-1")).toBe(
        "/en/posts/system-design-part-1"
      );
      expect(getPostUrl("ka", "ka/ჩემი-პოსტი")).toBe("/ka/posts/ჩემი-პოსტი");
    });

    it("builds correct URLs from bare slugs", () => {
      expect(getPostUrl("en", "my-post")).toBe("/en/posts/my-post");
    });

    it("uses the explicit target locale, not the identifier's prefix", () => {
      // Fallback system: an English-only post rendered on the /ka/ homepage
      // must link to the English detail page.
      expect(getPostUrl("ka", "en/english-only-post")).toBe(
        "/ka/posts/english-only-post"
      );
    });

    it("produces URLs that match the [locale]/posts/[slug] route contract", () => {
      const url = getPostUrl("en", "en/cross-locale-fallback");
      expect(url).toMatch(/^\/(en|ka)\/posts\/[^/]+$/);
      expect(url.startsWith("/en/posts/en/")).toBe(false);
    });
  });
});
