import { describe, it, expect } from "vitest";
import type { CollectionEntry } from "astro:content";
import getPostsByGroupCondition from "@/utils/getPostsByGroupCondition";
import { createMockBlogPost } from "@tests/helpers/mockBlogPost";

// Helper to create mock blog posts with custom tags
const createMockPost = (
  id: string,
  pubDate: Date = new Date("2024-01-01"),
  tags: string[] = [],
  published: boolean = true
): CollectionEntry<"blog"> =>
  createMockBlogPost(id, pubDate, null, published, {
    data: {
      tags,
      title: `Post ${id}`,
      author: "Test Author",
      description: "Test post",
    },
  });

// Helper to extract year from post
const getPostYear = (post: CollectionEntry<"blog">): string => {
  return new Date(post.data.pubDatetime).getFullYear().toString();
};

// Helper to extract year-month from post
const getPostYearMonth = (post: CollectionEntry<"blog">): string => {
  const date = new Date(post.data.pubDatetime);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

// Helper to group by first tag
const getPostFirstTag = (post: CollectionEntry<"blog">): string => {
  return post.data.tags[0] || "untagged";
};

describe("getPostsByGroupCondition", () => {
  it("should group posts by year", () => {
    const posts = [
      createMockPost("post1", new Date("2023-01-01")),
      createMockPost("post2", new Date("2024-01-01")),
      createMockPost("post3", new Date("2024-06-01")),
      createMockPost("post4", new Date("2025-01-01")),
    ];

    const result = getPostsByGroupCondition(posts, getPostYear);

    expect(result["2024"]).toHaveLength(2);
    expect(result["2024"]?.map((p) => p.id)).toEqual(["post2", "post3"]);
  });

  it("should group posts by year-month", () => {
    const posts = [
      createMockPost("post1", new Date("2024-01-01")),
      createMockPost("post2", new Date("2024-01-15")),
      createMockPost("post3", new Date("2024-02-01")),
      createMockPost("post4", new Date("2024-01-30")),
    ];

    const result = getPostsByGroupCondition(posts, getPostYearMonth);

    expect(result["2024-01"]).toHaveLength(3);
    expect(result["2024-01"]?.map((p) => p.id)).toContain("post1");
  });

  it("should group posts by tag", () => {
    const posts = [
      createMockPost("post1", new Date("2024-01-01"), ["typescript"]),
      createMockPost("post2", new Date("2024-01-02"), ["python"]),
      createMockPost("post3", new Date("2024-01-03"), ["typescript"]),
    ];

    const result = getPostsByGroupCondition(posts, getPostFirstTag);

    expect(result["typescript"]).toHaveLength(2);
    expect(result["python"]).toHaveLength(1);
  });

  it("should handle empty posts array", () => {
    const result = getPostsByGroupCondition([], getPostYear);
    expect(result).toEqual({});
  });

  it("should handle all years separately", () => {
    const posts = [
      createMockPost("post1", new Date("2023-01-01")),
      createMockPost("post2", new Date("2024-01-01")),
      createMockPost("post3", new Date("2025-01-01")),
    ];

    const result = getPostsByGroupCondition(posts, getPostYear);

    expect(result["2023"]).toHaveLength(1);
    expect(result["2024"]).toHaveLength(1);
    expect(result["2025"]).toHaveLength(1);
  });

  it("should handle month boundaries correctly", () => {
    const posts = [
      createMockPost("post1", new Date("2024-01-31")),
      createMockPost("post2", new Date("2024-02-01")),
      createMockPost("post3", new Date("2024-02-29")),
    ];

    const result = getPostsByGroupCondition(posts, getPostYearMonth);

    expect(result["2024-01"]).toHaveLength(1);
    expect(result["2024-02"]).toHaveLength(2);
  });

  it("should support custom grouping functions", () => {
    const posts = [
      createMockPost("post1", new Date("2024-01-01")),
      createMockPost("post2", new Date("2024-02-01")),
    ];

    // Custom function: group by day of week
    const getDay = (post: CollectionEntry<"blog">) => {
      const day = new Date(post.data.pubDatetime).toLocaleDateString("en-US", {
        weekday: "long",
      });
      return day;
    };

    const result = getPostsByGroupCondition(posts, getDay);

    expect(Object.keys(result).length).toBeGreaterThan(0);
  });

  it("should maintain original post order within groups", () => {
    const posts = [
      createMockPost("post1", new Date("2024-01-15")),
      createMockPost("post2", new Date("2024-01-10")),
      createMockPost("post3", new Date("2024-01-20")),
      createMockPost("post4", new Date("2024-01-05")),
    ];

    const result = getPostsByGroupCondition(posts, getPostYearMonth);

    expect(result["2024-01"]?.map((p) => p.id)).toEqual([
      "post1",
      "post2",
      "post3",
      "post4",
    ]);
  });

  it("should handle large number of posts", () => {
    const posts = new Array(365).fill(null).map((_, i) => {
      const date = new Date(2024, 0, 1);
      date.setDate(date.getDate() + i);
      return createMockPost(`post${i}`, date);
    });

    const result = getPostsByGroupCondition(posts, getPostYear);

    expect(result["2024"]?.length).toBeGreaterThan(0);
  });

  it("should handle index parameter in grouping function", () => {
    const posts = [
      createMockPost("post1", new Date("2024-01-01")),
      createMockPost("post2", new Date("2024-02-01")),
      createMockPost("post3", new Date("2024-03-01")),
    ];

    // Group by position: odd/even
    const getByIndex = (
      _post: CollectionEntry<"blog">,
      index?: number
    ): string => {
      return (index ?? 0) % 2 === 0 ? "even" : "odd";
    };

    const result = getPostsByGroupCondition(posts, getByIndex);

    expect(result["even"]?.length).toBeGreaterThan(0);
    expect(result["odd"]?.length).toBeGreaterThan(0);
  });

  it("should work with real-world blog scenarios", () => {
    const posts = [
      createMockPost("astro-intro", new Date("2024-01-15"), ["astro", "web"]),
      createMockPost("react-guide", new Date("2024-02-01"), ["react", "web"]),
      createMockPost("astro-ssg", new Date("2024-03-15"), ["astro", "performance"]),
    ];

    // Group by tag for archive
    const result = getPostsByGroupCondition(posts, getPostFirstTag);

    expect(result["astro"]).toHaveLength(2);
    expect(result["react"]).toHaveLength(1);
  });

  it("should support filtering with grouping functions", () => {
    const posts = [
      createMockPost("post1", new Date("2024-01-01"), [], true),
      createMockPost("post2", new Date("2024-01-02"), [], false),
      createMockPost("post3", new Date("2024-01-03"), [], true),
    ];

    // Filter published, then group
    const publishedPosts = posts.filter((p) => !p.data.draft);
    const result = getPostsByGroupCondition(publishedPosts, getPostYear);

    expect(result["2024"]).toHaveLength(2);
  });

  it("should handle all months correctly", () => {
    const posts = new Array(12)
      .fill(null)
      .map((_, i) => createMockPost(`month${i}`, new Date(2024, i, 1)));

    const result = getPostsByGroupCondition(posts, getPostYearMonth);

    expect(Object.keys(result).length).toBe(12);
  });

  it("should create separate groups for each unique key", () => {
    const posts = [
      createMockPost("post1", new Date("2024-01-01")),
      createMockPost("post2", new Date("2024-02-01")),
      createMockPost("post3", new Date("2024-03-01")),
    ];

    const result = getPostsByGroupCondition(posts, getPostYearMonth);

    expect(result["2024-01"]).toHaveLength(1);
    expect(result["2024-02"]).toHaveLength(1);
    expect(result["2024-03"]).toHaveLength(1);
  });

  it("should handle numeric and string keys", () => {
    const posts = [
      createMockPost("post1", new Date("2024-01-01")),
      createMockPost("post2", new Date("2024-01-02")),
    ];

    // Custom grouping function returning quarters
    const getQuarter = (post: CollectionEntry<"blog">) => {
      const month = new Date(post.data.pubDatetime).getMonth();
      return `Q${Math.floor(month / 3) + 1}`;
    };

    const result = getPostsByGroupCondition(posts, getQuarter);

    expect(result["Q1"]).toHaveLength(2);
  });
});
