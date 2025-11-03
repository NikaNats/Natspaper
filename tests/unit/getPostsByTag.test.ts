import { describe, it, expect } from "vitest";
import getPostsByTag from "@/utils/getPostsByTag";
import { createMockBlogPost } from "@tests/helpers/mockBlogPost";

// Helper to create mock blog posts with specific tags
const createMockPost = (
  id: string,
  tags: string[] = [],
  published: boolean = true
) =>
  createMockBlogPost(id, new Date("2024-01-01"), null, published, {
    data: { tags },
  });

describe("getPostsByTag", () => {
  it("should filter posts by exact tag", () => {
    const posts = [
      createMockPost("post1", ["typescript", "web"]),
      createMockPost("post2", ["python", "web"]),
      createMockPost("post3", ["typescript", "backend"]),
    ];

    const result = getPostsByTag(posts, "typescript");

    expect(result).toHaveLength(2);
    expect(result.map(p => p.id)).toEqual(["post1", "post3"]);
  });

  it("should handle case-insensitive tag matching", () => {
    const posts = [
      createMockPost("post1", ["TypeScript"]),
      createMockPost("post2", ["typescript"]),
      createMockPost("post3", ["TYPESCRIPT"]),
    ];

    // All should slugify to same value
    const result = getPostsByTag(posts, "type-script");

    expect(result.length).toBeGreaterThan(0);
  });

  it("should filter by slug version of tag", () => {
    const posts = [
      createMockPost("post1", ["Web Development"]),
      createMockPost("post2", ["web-development"]),
      createMockPost("post3", ["Web_Development"]),
    ];

    const result = getPostsByTag(posts, "web-development");

    expect(result.length).toBeGreaterThan(0);
  });

  it("should return empty array when tag not found", () => {
    const posts = [
      createMockPost("post1", ["typescript"]),
      createMockPost("post2", ["python"]),
    ];

    const result = getPostsByTag(posts, "rust");

    expect(result).toEqual([]);
  });

  it("should handle empty posts array", () => {
    const result = getPostsByTag([], "typescript");
    expect(result).toEqual([]);
  });

  it("should handle posts without tags", () => {
    const posts = [
      createMockPost("post1", []),
      createMockPost("post2", ["typescript"]),
      createMockPost("post3", []),
    ];

    const result = getPostsByTag(posts, "typescript");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("post2");
  });

  it("should filter out draft posts", () => {
    const posts = [
      createMockPost("post1", ["typescript"], true),
      createMockPost("post2", ["typescript"], false), // draft
      createMockPost("post3", ["typescript"], true),
    ];

    const result = getPostsByTag(posts, "typescript");

    expect(result).toHaveLength(2);
    expect(result.map(p => p.id)).not.toContain("post2");
  });

  it("should handle multiple tags on single post", () => {
    const posts = [
      createMockPost("post1", ["typescript", "frontend", "react", "web"]),
      createMockPost("post2", ["python"]),
    ];

    const result = getPostsByTag(posts, "react");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("post1");
  });

  it("should handle special characters in tags", () => {
    const posts = [
      createMockPost("post1", ["C++"]),
      createMockPost("post2", ["C#"]),
      createMockPost("post3", ["Node.js"]),
    ];

    // Tags are slugified for matching
    const result = getPostsByTag(posts, "node-js");

    expect(result).toHaveLength(1);
  });

  it("should maintain post order from input", () => {
    const posts = [
      createMockPost("post1", ["typescript"]),
      createMockPost("post2", ["web"]),
      createMockPost("post3", ["typescript"]),
      createMockPost("post4", ["backend"]),
      createMockPost("post5", ["typescript"]),
    ];

    const result = getPostsByTag(posts, "typescript");

    expect(result.map(p => p.id)).toEqual(["post1", "post3", "post5"]);
  });

  it("should handle whitespace in tag matching", () => {
    const posts = [
      createMockPost("post1", ["Web Development"]),
      createMockPost("post2", ["web development"]),
    ];

    const result = getPostsByTag(posts, "web-development");

    expect(result.length).toBeGreaterThan(0);
  });

  it("should work with real-world tag scenarios", () => {
    const posts = [
      createMockPost("astro-intro", ["Astro", "Web Development", "JavaScript"]),
      createMockPost("react-guide", ["React", "JavaScript", "Frontend"]),
      createMockPost("astro-ssg", ["Astro", "Static Site Generation", "Performance"]),
      createMockPost("vue-tutorial", ["Vue", "JavaScript", "Frontend"]),
    ];

    const astroResult = getPostsByTag(posts, "astro");
    const frontendResult = getPostsByTag(posts, "frontend");

    expect(astroResult).toHaveLength(2);
    expect(frontendResult).toHaveLength(2);
  });

  it("should handle empty tag string", () => {
    const posts = [
      createMockPost("post1", ["typescript"]),
      createMockPost("post2", []),
    ];

    const result = getPostsByTag(posts, "");

    expect(result).toEqual([]);
  });

  it("should not match partial tag names", () => {
    const posts = [
      createMockPost("post1", ["typescript"]),
      createMockPost("post2", ["type"]),
    ];

    const result = getPostsByTag(posts, "type");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("post2");
  });

  it("should handle mixed case with spaces and hyphens", () => {
    const posts = [
      createMockPost("post1", ["Web Development"]),
      createMockPost("post2", ["React Testing"]),
    ];

    // Tags need to be slugified for matching
    const result1 = getPostsByTag(posts, "web-development");
    const result2 = getPostsByTag(posts, "react-testing");

    expect(result1.length).toBeGreaterThan(0);
    expect(result2.length).toBeGreaterThan(0);
  });

  it("should handle large number of posts efficiently", () => {
    const posts = new Array(100).fill(null).map((_, i) => {
      const tags = i % 5 === 0 ? ["featured"] : ["regular"];
      return createMockPost(`post${i}`, tags);
    });

    const result = getPostsByTag(posts, "featured");

    expect(result).toHaveLength(20);
  });
});
