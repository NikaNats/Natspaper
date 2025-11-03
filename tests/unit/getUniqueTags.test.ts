import { describe, it, expect } from "vitest";
import type { CollectionEntry } from "astro:content";
import getUniqueTags from "@/utils/getUniqueTags";
import { createMockBlogPost } from "@tests/helpers/mockBlogPost";

// Helper to create mock blog posts with custom tags
const createMockPost = (
  id: string,
  tags: string[],
  published: boolean = true
): CollectionEntry<"blog"> =>
  createMockBlogPost(id, new Date("2024-01-01"), null, published, {
    data: {
      tags,
      title: `Post ${id}`,
      author: "Test Author",
      description: "Test post",
    },
  });

describe("getUniqueTags", () => {
  it("should extract unique tags from multiple posts", () => {
    const posts = [
      createMockPost("post1", ["typescript", "web"]),
      createMockPost("post2", ["typescript", "react"]),
      createMockPost("post3", ["web"]),
    ];

    const tags = getUniqueTags(posts);

    expect(tags).toHaveLength(3);
    expect(tags.map(t => t.tag)).toEqual(["react", "typescript", "web"]);
  });

  it("should preserve original tag names", () => {
    const posts = [
      createMockPost("post1", ["TypeScript", "Web Development"]),
    ];

    const tags = getUniqueTags(posts);

    expect(tags).toHaveLength(2);
    // Tags are sorted alphabetically by slug, so type-script comes before web-development
    expect(tags[0].tag).toBe("type-script");
    expect(tags[0].tagName).toBe("TypeScript");
    expect(tags[1].tag).toBe("web-development");
    expect(tags[1].tagName).toBe("Web Development");
  });

  it("should return both slug and tagName", () => {
    const posts = [createMockPost("post1", ["My Test Tag"])];

    const tags = getUniqueTags(posts);

    expect(tags[0]).toHaveProperty("tag", "my-test-tag");
    expect(tags[0]).toHaveProperty("tagName", "My Test Tag");
  });

  it("should handle empty post array", () => {
    const tags = getUniqueTags([]);
    expect(tags).toEqual([]);
  });

  it("should sort tags alphabetically by slug", () => {
    const posts = [
      createMockPost("post1", ["Zebra", "Apple", "Banana"]),
    ];

    const tags = getUniqueTags(posts);

    expect(tags[0].tag).toBe("apple");
    expect(tags[1].tag).toBe("banana");
    expect(tags[2].tag).toBe("zebra");
  });

  it("should filter out duplicate tags (case-insensitive)", () => {
    const posts = [
      createMockPost("post1", ["TypeScript", "React"]),
      createMockPost("post2", ["typescript"]), // Duplicate (case variation)
      createMockPost("post3", ["React"]), // Duplicate
    ];

    const tags = getUniqueTags(posts);

    // Only unique slugs are returned, duplicates are filtered out
    expect(tags.map(t => t.tag)).toContain("react");
    expect(tags.map(t => t.tag)).toContain("typescript");
  });

  it("should handle special characters in tags", () => {
    const posts = [
      createMockPost("post1", ["C++", "C#", "Node.js", "React.js"]),
    ];

    const tags = getUniqueTags(posts);

    expect(tags.length).toBeGreaterThan(0);
    expect(tags.map(t => t.tagName)).toContain("C++");
    expect(tags.map(t => t.tagName)).toContain("Node.js");
  });

  it("should handle posts with no tags", () => {
    const posts = [
      createMockPost("post1", ["typescript"]),
      createMockPost("post2", []),
      createMockPost("post3", ["react"]),
    ];

    const tags = getUniqueTags(posts);

    expect(tags).toHaveLength(2);
    expect(tags.map(t => t.tag)).toEqual(["react", "typescript"]);
  });

  it("should filter out draft posts", () => {
    const posts = [
      createMockPost("post1", ["typescript"], true),
      createMockPost("post2", ["react"], false), // draft
      createMockPost("post3", ["vue"], true),
    ];

    const tags = getUniqueTags(posts);

    // Should not include "react" from draft post
    expect(tags.map(t => t.tag)).toEqual(["typescript", "vue"]);
    expect(tags.map(t => t.tag)).not.toContain("react");
  });

  it("should handle single post with multiple tags", () => {
    const posts = [
      createMockPost("post1", ["tag1", "tag2", "tag3", "tag4"]),
    ];

    const tags = getUniqueTags(posts);

    expect(tags).toHaveLength(4);
  });

  it("should handle many posts with overlapping tags", () => {
    const posts = [
      createMockPost("post1", ["typescript", "javascript", "web"]),
      createMockPost("post2", ["typescript", "nodejs"]),
      createMockPost("post3", ["javascript", "react"]),
      createMockPost("post4", ["typescript", "vue"]),
    ];

    const tags = getUniqueTags(posts);

    // Should have 6 unique tags: javascript, nodejs, react, typescript, vue, web
    expect(tags).toHaveLength(6);
    expect(tags.map(t => t.tag)).toContain("typescript");
  });

  it("should maintain alphabetical order regardless of tag frequency", () => {
    const posts = [
      createMockPost("post1", ["zebra", "apple"]),
      createMockPost("post2", ["apple", "apple", "apple"]),
      createMockPost("post3", ["banana"]),
    ];

    const tags = getUniqueTags(posts);

    expect(tags.map(t => t.tag)).toEqual(["apple", "banana", "zebra"]);
  });

  it("should handle real-world tag names", () => {
    const posts = [
      createMockPost("post1", [
        "Web Development",
        "Frontend",
        "React",
        "TypeScript",
      ]),
      createMockPost("post2", [
        "Backend",
        "Node.js",
        "API Design",
        "TypeScript",
      ]),
      createMockPost("post3", ["DevOps", "Docker", "Kubernetes"]),
    ];

    const tags = getUniqueTags(posts);

    expect(tags.length).toBeGreaterThan(0);
    expect(tags.map(t => t.tagName)).toContain("Web Development");
    expect(tags.map(t => t.tagName)).toContain("TypeScript");
    // Should not have duplicates
    const slugs = tags.map(t => t.tag);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
