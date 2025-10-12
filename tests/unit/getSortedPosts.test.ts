import { describe, it, expect } from "vitest";
import type { CollectionEntry } from "astro:content";
import getSortedPosts from "@/utils/getSortedPosts";

// Helper to create mock blog posts
const createMockPost = (
  id: string,
  pubDate: Date,
  modDate?: Date,
  published: boolean = true
): CollectionEntry<"blog"> => ({
  id,
  collection: "blog",
  data: {
    title: `Post ${id}`,
    author: "Test Author",
    pubDatetime: pubDate,
    modDatetime: modDate || null,
    description: "Test post",
    tags: ["test"],
    ...(published ? {} : { draft: true }),
  },
  body: "Test content",
});

describe("getSortedPosts", () => {
  it("should sort posts by newest first (pubDatetime)", () => {
    const posts = [
      createMockPost("post1", new Date("2024-01-01")),
      createMockPost("post3", new Date("2024-03-01")),
      createMockPost("post2", new Date("2024-02-01")),
    ];

    const sorted = getSortedPosts(posts);

    expect(sorted[0].id).toBe("post3");
    expect(sorted[1].id).toBe("post2");
    expect(sorted[2].id).toBe("post1");
  });

  it("should use modDatetime if available", () => {
    const posts = [
      createMockPost(
        "post1",
        new Date("2024-01-01"),
        new Date("2024-03-15")
      ),
      createMockPost("post2", new Date("2024-03-01")),
    ];

    const sorted = getSortedPosts(posts);

    // post1 has modDate of 2024-03-15, which is newer than post2's pubDate
    expect(sorted[0].id).toBe("post1");
  });

  it("should filter out draft posts", () => {
    const posts = [
      createMockPost("post1", new Date("2024-01-01"), undefined, true),
      createMockPost("post2", new Date("2024-02-01"), undefined, false), // draft
      createMockPost("post3", new Date("2024-03-01"), undefined, true),
    ];

    const sorted = getSortedPosts(posts);

    expect(sorted).toHaveLength(2);
    expect(sorted.map(p => p.id)).not.toContain("post2");
  });

  it("should handle empty array", () => {
    const sorted = getSortedPosts([]);
    expect(sorted).toEqual([]);
  });

  it("should handle single post", () => {
    const posts = [createMockPost("post1", new Date("2024-01-01"))];
    const sorted = getSortedPosts(posts);

    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe("post1");
  });

  it("should handle posts with same date", () => {
    const sameDate = new Date("2024-01-01");
    const posts = [
      createMockPost("post1", sameDate),
      createMockPost("post2", sameDate),
      createMockPost("post3", sameDate),
    ];

    const sorted = getSortedPosts(posts);

    expect(sorted).toHaveLength(3);
    // All have same date, so order should be stable
  });

  it("should handle very old and very new dates", () => {
    const posts = [
      createMockPost("post1", new Date("2020-01-01")),
      createMockPost("post2", new Date("2025-12-31")),
      createMockPost("post3", new Date("2023-06-15")),
    ];

    const sorted = getSortedPosts(posts);

    expect(sorted[0].id).toBe("post2");
    expect(sorted[2].id).toBe("post1");
  });

  it("should handle mixed draft and published posts", () => {
    const posts = [
      createMockPost("post1", new Date("2024-03-01"), undefined, true),
      createMockPost("post2", new Date("2024-02-01"), undefined, false),
      createMockPost("post3", new Date("2024-01-01"), undefined, true),
      createMockPost("post4", new Date("2024-04-01"), undefined, false),
    ];

    const sorted = getSortedPosts(posts);

    expect(sorted).toHaveLength(2);
    expect(sorted.map(p => p.id)).toEqual(["post1", "post3"]);
  });

  it("should prioritize modDatetime over pubDatetime for sorting", () => {
    const posts = [
      createMockPost(
        "post1",
        new Date("2024-01-01"),
        new Date("2024-03-15")
      ),
      createMockPost(
        "post2",
        new Date("2024-03-01"),
        new Date("2024-02-15")
      ),
    ];

    const sorted = getSortedPosts(posts);

    // post1 has modDate 2024-03-15 which is newest
    expect(sorted[0].id).toBe("post1");
  });

  it("should handle large number of posts efficiently", () => {
    const posts = new Array(100).fill(null).map((_, i) =>
      createMockPost(
        `post${i}`,
        new Date(2024, 0, i % 30 + 1)
      )
    );

    const sorted = getSortedPosts(posts);

    // Should still be sorted correctly
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = new Date(sorted[i].data.modDatetime ?? sorted[i].data.pubDatetime);
      const next = new Date(sorted[i + 1].data.modDatetime ?? sorted[i + 1].data.pubDatetime);
      expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
    }
  });

  it("should handle real-world blog post scenarios", () => {
    const posts = [
      createMockPost(
        "getting-started",
        new Date("2024-01-15"),
        undefined,
        true
      ),
      createMockPost(
        "draft-post",
        new Date("2024-02-01"),
        undefined,
        false
      ),
      createMockPost(
        "updated-guide",
        new Date("2024-02-01"),
        new Date("2024-02-10"),
        true
      ),
      createMockPost(
        "latest-news",
        new Date("2024-02-15"),
        undefined,
        true
      ),
    ];

    const sorted = getSortedPosts(posts);

    expect(sorted).toHaveLength(3);
    expect(sorted[0].id).toBe("latest-news");
    expect(sorted[1].id).toBe("updated-guide");
    expect(sorted[2].id).toBe("getting-started");
  });

  it("should maintain sort stability", () => {
    const sameDate = new Date("2024-01-01");
    const posts = [
      createMockPost("post1", sameDate),
      createMockPost("post2", sameDate),
      createMockPost("post3", sameDate),
    ];

    const sorted1 = getSortedPosts(posts);
    const sorted2 = getSortedPosts(posts);

    // Results should be consistent
    expect(sorted1.map(p => p.id)).toEqual(sorted2.map(p => p.id));
  });
});
