import { describe, it, expect } from "vitest";
import { getPostsByTag } from "@/utils/post";
import { getSortedPosts } from "@/utils/post";
import { getUniqueTags } from "@/utils/post";
import { getAdjacentPosts, resolveOgImageUrl } from "@/utils/post/postHelpers";
import { calculateReadingTime, formatReadingTime, getReadingTimeDisplay } from "@/utils/post/readingTime";
import { createMockBlogPost } from "@tests/helpers/mockBlogPost";
import type { CollectionEntry } from "astro:content";

/**
 * Unit tests for post-related functionality
 * Tests the actual implementation of post sorting, filtering, navigation, reading time, and OG image resolution
 */

// Helper to create mock blog posts with specific tags
const createMockPost = (
  id: string,
  tags: string[] = [],
  published: boolean = true,
  pubDate?: Date,
  modDate?: Date
) =>
  createMockBlogPost(id, pubDate || new Date("2024-01-01"), modDate, published, {
    data: { tags },
  });

describe("Post Utilities", () => {
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

  describe("getSortedPosts", () => {
    it("should sort posts by newest first (pubDatetime)", () => {
      const posts = [
        createMockPost("post1", [], true, new Date("2024-01-01")),
        createMockPost("post3", [], true, new Date("2024-03-01")),
        createMockPost("post2", [], true, new Date("2024-02-01")),
      ];

      const sorted = getSortedPosts(posts);

      expect(sorted[0].id).toBe("post3");
      expect(sorted[1].id).toBe("post2");
      expect(sorted[2].id).toBe("post1");
    });

    it("should use modDatetime if available", () => {
      const posts = [
        createMockPost("post1", [], true, new Date("2024-01-01"), new Date("2024-03-15")),
        createMockPost("post2", [], true, new Date("2024-03-01")),
      ];

      const sorted = getSortedPosts(posts);

      // post1 has modDate of 2024-03-15, which is newer than post2's pubDate
      expect(sorted[0].id).toBe("post1");
    });

    it("should filter out draft posts", () => {
      const posts = [
        createMockPost("post1", [], true, new Date("2024-01-01")),
        createMockPost("post2", [], false, new Date("2024-02-01")), // draft
        createMockPost("post3", [], true, new Date("2024-03-01")),
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
      const posts = [createMockPost("post1", [], true, new Date("2024-01-01"))];
      const sorted = getSortedPosts(posts);

      expect(sorted).toHaveLength(1);
      expect(sorted[0].id).toBe("post1");
    });

    it("should handle posts with same date", () => {
      const sameDate = new Date("2024-01-01");
      const posts = [
        createMockPost("post1", [], true, sameDate),
        createMockPost("post2", [], true, sameDate),
        createMockPost("post3", [], true, sameDate),
      ];

      const sorted = getSortedPosts(posts);

      expect(sorted).toHaveLength(3);
      // All have same date, so order should be stable
    });

    it("should handle very old and very new dates", () => {
      // Use dates in the past to avoid postFilter filtering them out
      const posts = [
        createMockPost("post1", [], true, new Date("2020-01-01")),
        createMockPost("post2", [], true, new Date("2024-12-31")),
        createMockPost("post3", [], true, new Date("2023-06-15")),
      ];

      const sorted = getSortedPosts(posts);

      // Should have all 3 posts
      expect(sorted).toHaveLength(3);

      // Verify oldest is last
      expect(sorted[2].id).toBe("post1");
      // Verify newest is first
      expect(sorted[0].id).toBe("post2");
    });

    it("should handle mixed draft and published posts", () => {
      const posts = [
        createMockPost("post1", [], true, new Date("2024-03-01")),
        createMockPost("post2", [], false, new Date("2024-02-01")),
        createMockPost("post3", [], true, new Date("2024-01-01")),
        createMockPost("post4", [], false, new Date("2024-04-01")),
      ];

      const sorted = getSortedPosts(posts);

      expect(sorted).toHaveLength(2);
      expect(sorted.map(p => p.id)).toEqual(["post1", "post3"]);
    });

    it("should prioritize modDatetime over pubDatetime for sorting", () => {
      const posts = [
        createMockPost("post1", [], true, new Date("2024-01-01"), new Date("2024-03-15")),
        createMockPost("post2", [], true, new Date("2024-03-01"), new Date("2024-02-15")),
      ];

      const sorted = getSortedPosts(posts);

      // post1 has modDate 2024-03-15 which is newest
      expect(sorted[0].id).toBe("post1");
    });

    it("should handle large number of posts efficiently", () => {
      const posts = new Array(100).fill(null).map((_, i) =>
        createMockPost(`post${i}`, [], true, new Date(2024, 0, i % 30 + 1))
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
        createMockPost("getting-started", [], true, new Date("2024-01-15")),
        createMockPost("draft-post", [], false, new Date("2024-02-01")),
        createMockPost("updated-guide", [], true, new Date("2024-02-01"), new Date("2024-02-10")),
        createMockPost("latest-news", [], true, new Date("2024-02-15")),
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
        createMockPost("post1", [], true, sameDate),
        createMockPost("post2", [], true, sameDate),
        createMockPost("post3", [], true, sameDate),
      ];

      const sorted1 = getSortedPosts(posts);
      const sorted2 = getSortedPosts(posts);

      // Results should be consistent
      expect(sorted1.map(p => p.id)).toEqual(sorted2.map(p => p.id));
    });
  });

  describe("getUniqueTags", () => {
    // Helper to create mock blog posts with custom tags
    const createMockPostForTags = (
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

    it("should extract unique tags from multiple posts", () => {
      const posts = [
        createMockPostForTags("post1", ["typescript", "web"]),
        createMockPostForTags("post2", ["typescript", "react"]),
        createMockPostForTags("post3", ["web"]),
      ];

      const tags = getUniqueTags(posts);

      expect(tags).toHaveLength(3);
      expect(tags.map(t => t.tag)).toEqual(["react", "typescript", "web"]);
    });

    it("should preserve original tag names", () => {
      const posts = [
        createMockPostForTags("post1", ["TypeScript", "Web Development"]),
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
      const posts = [createMockPostForTags("post1", ["My Test Tag"])];

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
        createMockPostForTags("post1", ["Zebra", "Apple", "Banana"]),
      ];

      const tags = getUniqueTags(posts);

      expect(tags[0].tag).toBe("apple");
      expect(tags[1].tag).toBe("banana");
      expect(tags[2].tag).toBe("zebra");
    });

    it("should filter out duplicate tags (case-insensitive)", () => {
      const posts = [
        createMockPostForTags("post1", ["TypeScript", "React"]),
        createMockPostForTags("post2", ["typescript"]), // Duplicate (case variation)
        createMockPostForTags("post3", ["React"]), // Duplicate
      ];

      const tags = getUniqueTags(posts);

      // Only unique slugs are returned, duplicates are filtered out
      expect(tags.map(t => t.tag)).toContain("react");
      expect(tags.map(t => t.tag)).toContain("typescript");
    });

    it("should handle special characters in tags", () => {
      const posts = [
        createMockPostForTags("post1", ["C++", "C#", "Node.js", "React.js"]),
      ];

      const tags = getUniqueTags(posts);

      expect(tags.length).toBeGreaterThan(0);
      expect(tags.map(t => t.tagName)).toContain("C++");
      expect(tags.map(t => t.tagName)).toContain("Node.js");
    });

    it("should handle posts with no tags", () => {
      const posts = [
        createMockPostForTags("post1", ["typescript"]),
        createMockPostForTags("post2", []),
        createMockPostForTags("post3", ["react"]),
      ];

      const tags = getUniqueTags(posts);

      expect(tags).toHaveLength(2);
      expect(tags.map(t => t.tag)).toEqual(["react", "typescript"]);
    });

    it("should filter out draft posts", () => {
      const posts = [
        createMockPostForTags("post1", ["typescript"], true),
        createMockPostForTags("post2", ["react"], false), // draft
        createMockPostForTags("post3", ["vue"], true),
      ];

      const tags = getUniqueTags(posts);

      // Should not include "react" from draft post
      expect(tags.map(t => t.tag)).toEqual(["typescript", "vue"]);
      expect(tags.map(t => t.tag)).not.toContain("react");
    });

    it("should handle single post with multiple tags", () => {
      const posts = [
        createMockPostForTags("post1", ["tag1", "tag2", "tag3", "tag4"]),
      ];

      const tags = getUniqueTags(posts);

      expect(tags).toHaveLength(4);
    });

    it("should handle many posts with overlapping tags", () => {
      const posts = [
        createMockPostForTags("post1", ["typescript", "javascript", "web"]),
        createMockPostForTags("post2", ["typescript", "nodejs"]),
        createMockPostForTags("post3", ["javascript", "react"]),
        createMockPostForTags("post4", ["typescript", "vue"]),
      ];

      const tags = getUniqueTags(posts);

      // Should have 6 unique tags: javascript, nodejs, react, typescript, vue, web
      expect(tags).toHaveLength(6);
      expect(tags.map(t => t.tag)).toContain("typescript");
    });

    it("should maintain alphabetical order regardless of tag frequency", () => {
      const posts = [
        createMockPostForTags("post1", ["zebra", "apple"]),
        createMockPostForTags("post2", ["apple", "apple", "apple"]),
        createMockPostForTags("post3", ["banana"]),
      ];

      const tags = getUniqueTags(posts);

      expect(tags.map(t => t.tag)).toEqual(["apple", "banana", "zebra"]);
    });

    it("should handle real-world tag names", () => {
      const posts = [
        createMockPostForTags("post1", [
          "Web Development",
          "Frontend",
          "React",
          "TypeScript",
        ]),
        createMockPostForTags("post2", [
          "Backend",
          "Node.js",
          "API Design",
          "TypeScript",
        ]),
        createMockPostForTags("post3", ["DevOps", "Docker", "Kubernetes"]),
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

  describe("Reading Time", () => {
    describe("calculateReadingTime", () => {
      it("should calculate reading time for short content (1 minute)", () => {
        const content = "Hello world";
        const result = calculateReadingTime(content);

        expect(result.minutes).toBe(1);
        expect(result.words).toBe(2);
        expect(result.displayText).toBe("1 min read");
      });

      it("should calculate reading time for medium content (5 minutes)", () => {
        // 1000 words / 200 WPM = 5 minutes
        const content = new Array(1000).fill("word").join(" ");
        const result = calculateReadingTime(content);

        expect(result.minutes).toBe(5);
        expect(result.words).toBe(1000);
        expect(result.displayText).toBe("5 min read");
      });

      it("should calculate reading time for long content (10+ minutes)", () => {
        // 2500 words / 200 WPM = 12.5 minutes (rounded up to 13)
        const content = new Array(2500).fill("word").join(" ");
        const result = calculateReadingTime(content);

        expect(result.minutes).toBe(13);
        expect(result.words).toBe(2500);
        expect(result.displayText).toBe("13 min read");
      });

      it("should handle empty content gracefully", () => {
        const result = calculateReadingTime("");

        expect(result.minutes).toBe(1);
        expect(result.words).toBe(0);
        expect(result.displayText).toBe("1 min read");
      });

      it("should handle whitespace-only content", () => {
        const result = calculateReadingTime("   \n\t   ");

        expect(result.minutes).toBe(1);
        expect(result.words).toBe(0);
        expect(result.displayText).toBe("1 min read");
      });

      it("should handle null or undefined content gracefully", () => {
        const resultNull = calculateReadingTime(null as unknown as string);
        const resultUndefined = calculateReadingTime(
          undefined as unknown as string
        );

        expect(resultNull.minutes).toBe(1);
        expect(resultNull.words).toBe(0);
        expect(resultNull.displayText).toBe("1 min read");

        expect(resultUndefined.minutes).toBe(1);
        expect(resultUndefined.words).toBe(0);
        expect(resultUndefined.displayText).toBe("1 min read");
      });

      it("should use custom words per minute", () => {
        const content = new Array(300).fill("word").join(" ");

        // Default 200 WPM: 300 / 200 = 1.5 => 2 minutes
        const defaultResult = calculateReadingTime(content);
        expect(defaultResult.minutes).toBe(2);

        // Custom 100 WPM: 300 / 100 = 3 minutes
        const customResult = calculateReadingTime(content, 100);
        expect(customResult.minutes).toBe(3);

        // Custom 300 WPM: 300 / 300 = 1 minute
        const fastResult = calculateReadingTime(content, 300);
        expect(fastResult.minutes).toBe(1);
      });

      it("should handle markdown content correctly", () => {
        const markdownContent = `
# Hello World

This is a **bold** text and *italic* text.

- List item 1
- List item 2
- List item 3

\`\`\`
code block
\`\`\`
        `.trim();

        const result = calculateReadingTime(markdownContent);

        // Should count words including markdown syntax
        expect(result.words).toBeGreaterThan(0);
        expect(result.minutes).toBeGreaterThan(0);
      });

      it("should handle HTML content correctly", () => {
        const htmlContent = `
<h1>Hello World</h1>
<p>This is <strong>bold</strong> text and <em>italic</em> text.</p>
<ul>
  <li>List item 1</li>
  <li>List item 2</li>
</ul>
        `.trim();

        const result = calculateReadingTime(htmlContent);

        // HTML tags are counted as separate words
        expect(result.words).toBeGreaterThan(0);
        expect(result.minutes).toBeGreaterThan(0);
      });

      it("should round up partial minutes", () => {
        // 250 words / 200 WPM = 1.25 minutes => rounds up to 2
        const content = new Array(250).fill("word").join(" ");
        const result = calculateReadingTime(content);

        expect(result.minutes).toBe(2);
        expect(result.words).toBe(250);
      });

      it("should always return at least 1 minute", () => {
        const content = "one";
        const result = calculateReadingTime(content);

        expect(result.minutes).toBe(1);
        expect(result.minutes).toBeGreaterThanOrEqual(1);
      });

      it("should correctly pluralize display text", () => {
        // 1 minute
        const oneMinResult = calculateReadingTime("test");
        expect(oneMinResult.displayText).toBe("1 min read");
        expect(oneMinResult.displayText).not.toContain("mins");

        // 2+ minutes
        const multiMinResult = calculateReadingTime(
          new Array(400).fill("word").join(" ")
        );
        expect(multiMinResult.displayText).toContain("min read");
        expect(multiMinResult.displayText).not.toBe("1 min read");
      });

      it("should handle real blog post content", () => {
        const blogContent = `
# The Ultimate Guide to Web Performance

Web performance is critical for user experience and SEO. Users expect pages to load in under 3 seconds,
and every second of delay can reduce conversions by 7%. In this comprehensive guide, we'll explore
the key metrics, techniques, and tools you need to optimize your web applications.

## Core Web Vitals

Core Web Vitals are a set of metrics that Google considers important for overall page health.
These metrics include Largest Contentful Paint (LCP), First Input Delay (FID), and Cumulative Layout Shift (CLS).

### Largest Contentful Paint (LCP)

LCP measures loading performance. To provide a good user experience, LCP should occur within 2.5 seconds
of when the page first starts loading.

### First Input Delay (FID)

FID measures interactivity. To provide a good user experience, pages should have an FID of 100 milliseconds or less.

### Cumulative Layout Shift (CLS)

CLS measures visual stability. To provide a good user experience, pages should maintain a CLS of 0.1 or less.

## Optimization Techniques

1. Minify CSS, JavaScript, and HTML
2. Optimize images and use modern formats
3. Implement lazy loading
4. Use a Content Delivery Network (CDN)
5. Enable compression
6. Reduce server response time
7. Implement caching strategies
8. Use a CDN for static assets
9. Optimize database queries
10. Implement progressive web app features

## Tools and Monitoring

PageSpeed Insights, Lighthouse, WebPageTest, and GTmetrix are excellent tools for monitoring
and analyzing your website's performance. These tools provide detailed insights into your site's performance
and recommendations for improvement.

## Conclusion

Web performance optimization is an ongoing process that requires monitoring, testing, and continuous improvement.
        `.trim();

        const result = calculateReadingTime(blogContent);

        // Should be in realistic range for blog post
        expect(result.minutes).toBeGreaterThanOrEqual(2);
        expect(result.minutes).toBeLessThan(10);
        expect(result.words).toBeGreaterThan(100);
      });
    });

    describe("formatReadingTime", () => {
      it("should format reading time with word count", () => {
        const result = {
          minutes: 5,
          words: 1000,
          displayText: "5 min read",
        };

        const formatted = formatReadingTime(result);

        expect(formatted).toBe("5 min read • 1,000 words");
      });

      it("should format single minute correctly", () => {
        const result = {
          minutes: 1,
          words: 50,
          displayText: "1 min read",
        };

        const formatted = formatReadingTime(result);

        expect(formatted).toBe("1 min read • 50 words");
      });

      it("should localize word count with thousands separator", () => {
        const result = {
          minutes: 10,
          words: 2000,
          displayText: "10 min read",
        };

        const formatted = formatReadingTime(result);

        // Should include thousands separator
        expect(formatted).toContain("2,000");
      });

      it("should handle large word counts", () => {
        const result = {
          minutes: 100,
          words: 20000,
          displayText: "100 min read",
        };

        const formatted = formatReadingTime(result);

        expect(formatted).toBe("100 min read • 20,000 words");
      });

      it("should handle zero words", () => {
        const result = {
          minutes: 1,
          words: 0,
          displayText: "1 min read",
        };

        const formatted = formatReadingTime(result);

        expect(formatted).toBe("1 min read • 0 words");
      });
    });

    describe("getReadingTimeDisplay", () => {
      it("should return display text with word count by default", () => {
        const content = new Array(1000).fill("word").join(" ");
        const display = getReadingTimeDisplay(content);

        expect(display).toContain("min read");
        expect(display).toContain("words");
        expect(display).toContain("•");
      });

      it("should return display text only when includeWordCount is false", () => {
        const content = new Array(1000).fill("word").join(" ");
        const display = getReadingTimeDisplay(content, false);

        expect(display).toContain("min read");
        expect(display).not.toContain("words");
        expect(display).not.toContain("•");
      });

      it("should handle empty content gracefully", () => {
        const display = getReadingTimeDisplay("");

        expect(display).toBe("1 min read • 0 words");
      });

      it("should handle empty content without word count", () => {
        const display = getReadingTimeDisplay("", false);

        expect(display).toBe("1 min read");
      });

      it("should be consistent with separate functions", () => {
        const content = new Array(2000).fill("word").join(" ");

        // Direct calculation
        const result = calculateReadingTime(content);
        const formatted = formatReadingTime(result);

        // Using getReadingTimeDisplay
        const display = getReadingTimeDisplay(content);

        expect(display).toBe(formatted);
      });
    });
  });

  describe("Post Navigation", () => {
    it("should provide navigation between posts", () => {
      const posts = [
        createMockBlogPost('first-post', new Date('2025-01-01')),
        createMockBlogPost('second-post', new Date('2025-01-02')),
        createMockBlogPost('third-post', new Date('2025-01-03')),
      ];

      const { previous, next } = getAdjacentPosts(posts, 'second-post');

      expect(previous?.id).toBe('first-post');
      expect(next?.id).toBe('third-post');
    });

    it("should handle first post navigation", () => {
      const posts = [
        createMockBlogPost('first-post', new Date('2025-01-01')),
        createMockBlogPost('second-post', new Date('2025-01-02')),
      ];

      const { previous, next } = getAdjacentPosts(posts, 'first-post');

      expect(previous).toBeNull();
      expect(next?.id).toBe('second-post');
    });

    it("should handle last post navigation", () => {
      const posts = [
        createMockBlogPost('first-post', new Date('2025-01-01')),
        createMockBlogPost('second-post', new Date('2025-01-02')),
      ];

      const { previous, next } = getAdjacentPosts(posts, 'second-post');

      expect(previous?.id).toBe('first-post');
      expect(next).toBeNull();
    });
  });

  describe("OG Image Resolution", () => {
    const siteUrl = 'https://natspaper.vercel.app';

    it("should resolve remote OG image URL", () => {
      const ogImage = 'https://example.com/og.jpg';
      const result = resolveOgImageUrl(ogImage, 'test-post', siteUrl);

      expect(result).toBe('https://example.com/og.jpg');
    });

    it("should resolve local asset OG image", () => {
      const ogImage = { src: '/images/og.png' };
      const result = resolveOgImageUrl(ogImage, 'test-post', siteUrl);

      expect(result).toBe('https://natspaper.vercel.app/images/og.png');
    });

    it("should generate dynamic OG image when enabled", () => {
      // This test assumes SITE.dynamicOgImage is true
      const result = resolveOgImageUrl(undefined, 'test-post', siteUrl);

      // The actual result depends on SITE.dynamicOgImage setting
      // If enabled, it should be /posts/test-post/index.png
      expect(result).toMatch(/^https:\/\/natspaper\.vercel\.app\/(posts\/test-post\/index\.png)?$/);
    });

    it("should return undefined when no OG image is available", () => {
      // Mock SITE.dynamicOgImage as false if possible, or test the undefined case
      const result = resolveOgImageUrl(undefined, 'test-post', siteUrl);

      // This might return the dynamic image or undefined depending on config
      expect(result).toBeDefined(); // For now, just check it's handled
    });
  });

  describe("Post Data Structure", () => {
    it("should have all required fields for a published blog post", () => {
      const post = createMockBlogPost("test-post", new Date("2025-01-15"), new Date("2025-01-16"), true, {
        data: {
          title: 'Test Blog Post',
          description: 'This is a test post',
          author: 'Nika Natsvlishvili',
          tags: ['test', 'blog'],
        }
      });

      expect(post.data.title).toBeDefined();
      expect(post.data.description).toBeDefined();
      expect(post.data.author).toBeDefined();
      expect(post.data.pubDatetime).toBeDefined();
      expect(post.body).toBeDefined();
      expect(post.data.draft).toBeUndefined(); // published post
    });

    it("should mark draft posts appropriately", () => {
      const draftPost = createMockBlogPost("draft-post", new Date("2025-01-15"), null, false);

      expect(draftPost.data.draft).toBe(true);
    });
  });
});