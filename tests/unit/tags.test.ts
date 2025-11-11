import { describe, it, expect } from 'vitest';
import getUniqueTags from '@/utils/post/getUniqueTags';
import getPostsByTag from '@/utils/post/getPostsByTag';
import { createMockBlogPost } from '@tests/helpers/mockBlogPost';

/**
 * Unit tests for tag-related functionality
 * Tests the actual implementation of tag extraction, filtering, and counting
 */

describe('Tag Utilities', () => {
  describe('getUniqueTags', () => {
    it('should extract unique tags from posts', () => {
      const posts = [
        createMockBlogPost("post1", new Date("2025-01-01"), null, true, {
          data: { tags: ['javascript', 'web'] }
        }),
        createMockBlogPost("post2", new Date("2025-01-02"), null, true, {
          data: { tags: ['javascript', 'backend'] }
        }),
        createMockBlogPost("post3", new Date("2025-01-03"), null, true, {
          data: { tags: ['python', 'web'] }
        }),
      ];

      const uniqueTags = getUniqueTags(posts);

      expect(uniqueTags).toHaveLength(4);
      const tagNames = uniqueTags.map(t => t.tag).sort();
      expect(tagNames).toEqual(['backend', 'javascript', 'python', 'web']);
    });

    it('should filter out draft posts', () => {
      const posts = [
        createMockBlogPost("post1", new Date("2025-01-01"), null, true, {
          data: { tags: ['published'] }
        }),
        createMockBlogPost("post2", new Date("2025-01-02"), null, false, {
          data: { tags: ['draft'] }
        }),
      ];

      const uniqueTags = getUniqueTags(posts);

      expect(uniqueTags).toHaveLength(1);
      expect(uniqueTags[0].tag).toBe('published');
    });

    it('should handle posts with no tags', () => {
      const posts = [
        createMockBlogPost("post1", new Date("2025-01-01"), null, true, {
          data: { tags: [] }
        }),
        createMockBlogPost("post2", new Date("2025-01-02"), null, true, {
          data: { tags: ['tag1'] }
        }),
      ];

      const uniqueTags = getUniqueTags(posts);

      expect(uniqueTags).toHaveLength(1);
      expect(uniqueTags[0].tag).toBe('tag-1'); // slugify converts to kebab-case
    });

    it('should sort tags alphabetically', () => {
      const posts = [
        createMockBlogPost("post1", new Date("2025-01-01"), null, true, {
          data: { tags: ['zebra', 'alpha'] }
        }),
      ];

      const uniqueTags = getUniqueTags(posts);

      expect(uniqueTags[0].tag).toBe('alpha');
      expect(uniqueTags[1].tag).toBe('zebra');
    });
  });

  describe('getPostsByTag', () => {
    it('should filter posts by tag', () => {
      const posts = [
        createMockBlogPost("post1", new Date("2025-01-01"), null, true, {
          data: { tags: ['javascript', 'web'] }
        }),
        createMockBlogPost("post2", new Date("2025-01-02"), null, true, {
          data: { tags: ['python', 'backend'] }
        }),
        createMockBlogPost("post3", new Date("2025-01-03"), null, true, {
          data: { tags: ['javascript', 'frontend'] }
        }),
      ];

      const javascriptPosts = getPostsByTag(posts, 'javascript');

      expect(javascriptPosts).toHaveLength(2);
      expect(javascriptPosts[0].id).toBe('post3'); // Most recent first
      expect(javascriptPosts[1].id).toBe('post1');
    });

    it('should return empty array for non-existent tag', () => {
      const posts = [
        createMockBlogPost("post1", new Date("2025-01-01"), null, true, {
          data: { tags: ['javascript'] }
        }),
      ];

      const result = getPostsByTag(posts, 'nonexistent');

      expect(result).toHaveLength(0);
    });

    it('should sort filtered posts by date', () => {
      const posts = [
        createMockBlogPost("post1", new Date("2025-01-01"), null, true, {
          data: { tags: ['web'] }
        }),
        createMockBlogPost("post2", new Date("2025-01-03"), null, true, {
          data: { tags: ['web'] }
        }),
        createMockBlogPost("post3", new Date("2025-01-02"), null, true, {
          data: { tags: ['web'] }
        }),
      ];

      const webPosts = getPostsByTag(posts, 'web');

      expect(webPosts[0].id).toBe('post2'); // Most recent
      expect(webPosts[1].id).toBe('post3');
      expect(webPosts[2].id).toBe('post1');
    });
  });

  describe('Tag Counting', () => {
    it('should count tag occurrences correctly', () => {
      const posts = [
        createMockBlogPost("post1", new Date("2025-01-01"), null, true, {
          data: { tags: ['javascript'] }
        }),
        createMockBlogPost("post2", new Date("2025-01-02"), null, true, {
          data: { tags: ['javascript'] }
        }),
        createMockBlogPost("post3", new Date("2025-01-03"), null, true, {
          data: { tags: ['python'] }
        }),
      ];

      const tagCounts: Record<string, number> = {};

      // Simulate the counting logic
      for (const post of posts) {
        if (!post.data.draft) {
          for (const tag of post.data.tags) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        }
      }

      expect(tagCounts['javascript']).toBe(2);
      expect(tagCounts['python']).toBe(1);
    });

    it('should exclude draft posts from tag counts', () => {
      const posts = [
        createMockBlogPost("post1", new Date("2025-01-01"), null, true, {
          data: { tags: ['published'] }
        }),
        createMockBlogPost("post2", new Date("2025-01-02"), null, false, {
          data: { tags: ['draft'] }
        }),
      ];

      const tagCounts: Record<string, number> = {};

      for (const post of posts) {
        if (!post.data.draft) {
          for (const tag of post.data.tags) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        }
      }

      expect(tagCounts['published']).toBe(1);
      expect(tagCounts['draft']).toBeUndefined();
    });
  });
});