import { describe, it, expect, beforeEach, vi } from "vitest";
import type { CollectionEntry } from "astro:content";
import {
  resolveOgImageUrl,
  getAdjacentPosts,
  generatePostStructuredData,
} from "./postHelpers";

// Mock SITE config
vi.mock("@/config", () => ({
  SITE: {
    dynamicOgImage: true,
    title: "Test Site",
  },
}));

// Mock getPath utility
vi.mock("@/utils/getPath", () => ({
  getPath: (id: string) => `/posts/${id}`,
}));

describe("postHelpers", () => {
  describe("resolveOgImageUrl()", () => {
    it("should return remote URL when ogImage is a string", () => {
      const remoteUrl = "https://example.com/og.jpg";
      const result = resolveOgImageUrl(
        remoteUrl,
        "test-post",
        "src/content/blog/test-post.md",
        "https://mysite.com"
      );

      expect(result).toBe("https://example.com/og.jpg");
    });

    it("should return asset URL when ogImage has src property", () => {
      const assetImage = {
        src: "/images/og.png",
        width: 1200,
        height: 630,
        format: "png",
      } as const;
      const result = resolveOgImageUrl(
        assetImage,
        "test-post",
        "src/content/blog/test-post.md",
        "https://mysite.com"
      );

      expect(result).toBe("https://mysite.com/images/og.png");
    });

    it("should generate dynamic OG image when enabled and no explicit image", () => {
      const result = resolveOgImageUrl(
        undefined,
        "my-post",
        "src/content/blog/my-post.md",
        "https://mysite.com"
      );

      // With dynamic OG enabled, should return dynamic path
      expect(result).toContain("/posts/my-post/index.png");
    });

    it("should resolve relative URLs to absolute paths", () => {
      const result = resolveOgImageUrl(
        "/og-images/post.jpg",
        "test-post",
        "src/content/blog/test-post.md",
        "https://mysite.com"
      );

      expect(result).toBe("https://mysite.com/og-images/post.jpg");
    });

    it("should prioritize direct string URL over asset object", () => {
      const result = resolveOgImageUrl(
        "https://remote.com/og.jpg", // Direct URL takes priority
        "test-post",
        "src/content/blog/test-post.md",
        "https://mysite.com"
      );

      expect(result).toBe("https://remote.com/og.jpg");
    });
  });

  describe("getAdjacentPosts()", () => {
    let mockPosts: CollectionEntry<"blog">[];

    beforeEach(() => {
      mockPosts = [
        {
          id: "post-1",
          data: { title: "First Post" },
          filePath: "src/content/blog/post-1.md",
        } as CollectionEntry<"blog">,
        {
          id: "post-2",
          data: { title: "Second Post" },
          filePath: "src/content/blog/post-2.md",
        } as CollectionEntry<"blog">,
        {
          id: "post-3",
          data: { title: "Third Post" },
          filePath: "src/content/blog/post-3.md",
        } as CollectionEntry<"blog">,
      ];
    });

    it("should find previous and next posts correctly for middle post", () => {
      const result = getAdjacentPosts(mockPosts, "post-2");

      expect(result.previous).toEqual({
        id: "post-1",
        title: "First Post",
        filePath: "src/content/blog/post-1.md",
      });

      expect(result.next).toEqual({
        id: "post-3",
        title: "Third Post",
        filePath: "src/content/blog/post-3.md",
      });
    });

    it("should return null for previous when on first post", () => {
      const result = getAdjacentPosts(mockPosts, "post-1");

      expect(result.previous).toBeNull();
      expect(result.next).toEqual({
        id: "post-2",
        title: "Second Post",
        filePath: "src/content/blog/post-2.md",
      });
    });

    it("should return null for next when on last post", () => {
      const result = getAdjacentPosts(mockPosts, "post-3");

      expect(result.previous).toEqual({
        id: "post-2",
        title: "Second Post",
        filePath: "src/content/blog/post-2.md",
      });
      expect(result.next).toBeNull();
    });

    it("should handle non-existent post ID", () => {
      const result = getAdjacentPosts(mockPosts, "non-existent");

      expect(result.previous).toBeNull();
      expect(result.next).toBeNull();
    });

    it("should work with single post", () => {
      const singlePost = [mockPosts[0]];
      const result = getAdjacentPosts(singlePost, "post-1");

      expect(result.previous).toBeNull();
      expect(result.next).toBeNull();
    });

    it("should work with two posts", () => {
      const twoPosts = [mockPosts[0], mockPosts[1]];

      const firstResult = getAdjacentPosts(twoPosts, "post-1");
      expect(firstResult.previous).toBeNull();
      expect(firstResult.next?.id).toBe("post-2");

      const secondResult = getAdjacentPosts(twoPosts, "post-2");
      expect(secondResult.previous?.id).toBe("post-1");
      expect(secondResult.next).toBeNull();
    });
  });

  describe("generatePostStructuredData()", () => {
    let mockPost: CollectionEntry<"blog">;

    beforeEach(() => {
      mockPost = {
        id: "test-post",
        data: {
          title: "Test Post",
          description: "This is a test post",
          author: "Test Author",
          pubDatetime: new Date("2024-01-01"),
          modDatetime: new Date("2024-01-15"),
          tags: ["test", "demo"],
          ogImage: "https://example.com/og.jpg",
        },
        filePath: "src/content/blog/test-post.md",
      } as CollectionEntry<"blog">;
    });

    it("should create valid schema.org BlogPosting format", () => {
      const result = generatePostStructuredData(
        mockPost,
        "https://mysite.com",
        "https://mysite.com/posts/test-post"
      );

      expect(result["@context"]).toBe("https://schema.org");
      expect(result["@type"]).toBe("BlogPosting");
      expect(result.headline).toBe("Test Post");
      expect(result.description).toBe("This is a test post");
    });

    it("should include author information", () => {
      const result = generatePostStructuredData(
        mockPost,
        "https://mysite.com",
        "https://mysite.com/posts/test-post"
      );

      expect(result.author).toEqual({
        "@type": "Person",
        name: "Test Author",
      });
    });

    it("should format dates as ISO 8601", () => {
      const result = generatePostStructuredData(
        mockPost,
        "https://mysite.com",
        "https://mysite.com/posts/test-post"
      );

      expect(result.datePublished).toMatch(/\d{4}-\d{2}-\d{2}T/);
      expect(result.dateModified).toMatch(/\d{4}-\d{2}-\d{2}T/);
    });

    it("should include keywords from tags", () => {
      const result = generatePostStructuredData(
        mockPost,
        "https://mysite.com",
        "https://mysite.com/posts/test-post"
      );

      expect(result.keywords).toBe("test, demo");
    });

    it("should include OG image in structured data", () => {
      const result = generatePostStructuredData(
        mockPost,
        "https://mysite.com",
        "https://mysite.com/posts/test-post"
      );

      expect(result.image).toEqual({
        "@type": "ImageObject",
        url: "https://example.com/og.jpg",
      });
    });

    it("should use pubDatetime as dateModified when modDatetime is not provided", () => {
      const postWithoutModDate: CollectionEntry<"blog"> = {
        ...mockPost,
        data: {
          ...mockPost.data,
          modDatetime: undefined,
        },
      } as CollectionEntry<"blog">;

      const result = generatePostStructuredData(
        postWithoutModDate,
        "https://mysite.com",
        "https://mysite.com/posts/test-post"
      );

      expect(result.dateModified).toBe(result.datePublished);
    });

    it("should include URL", () => {
      const result = generatePostStructuredData(
        mockPost,
        "https://mysite.com",
        "https://mysite.com/posts/test-post"
      );

      expect(result.url).toBe("https://mysite.com/posts/test-post");
    });
  });
});
