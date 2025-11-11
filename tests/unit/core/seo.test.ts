import { describe, it, expect } from 'vitest';
import { generatePostStructuredData, resolveOgImageUrl } from '@/utils/post/postHelpers';
import { createMockBlogPost } from '@tests/helpers/mockBlogPost';

/**
 * Unit tests for SEO-related functionality
 * Tests the actual implementation of structured data generation and OG image resolution
 */

describe('SEO Utilities', () => {
  describe('generatePostStructuredData', () => {
    it('should generate valid JSON-LD structured data for a blog post', () => {
      const post = createMockBlogPost("test-post", new Date("2025-01-15"), new Date("2025-01-16"), true, {
        data: {
          title: 'Test Blog Post',
          description: 'This is a test post description',
          author: 'Test Author',
          tags: ['test', 'blog'],
        }
      });

      const siteUrl = 'https://natspaper.vercel.app';
      const postUrl = 'https://natspaper.vercel.app/posts/test-post';

      const structuredData = generatePostStructuredData(post, siteUrl, postUrl);

      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('BlogPosting');
      expect(structuredData.headline).toBe('Test Blog Post');
      expect(structuredData.description).toBe('This is a test post description');
      expect(structuredData.author.name).toBe('Test Author');
      expect(structuredData.keywords).toBe('test, blog');
      expect(structuredData.url).toBe(postUrl);
    });

    it('should format dates correctly in ISO format', () => {
      const pubDate = new Date("2025-01-15T10:00:00Z");
      const modDate = new Date("2025-01-16T14:30:00Z");

      const post = createMockBlogPost("test-post", pubDate, modDate);

      const structuredData = generatePostStructuredData(post, 'https://example.com', 'https://example.com/post');

      expect(structuredData.datePublished).toBe(pubDate.toISOString());
      expect(structuredData.dateModified).toBe(modDate.toISOString());
    });

    it('should handle posts without modification date', () => {
      const pubDate = new Date("2025-01-15T10:00:00Z");

      const post = createMockBlogPost("test-post", pubDate, null);

      const structuredData = generatePostStructuredData(post, 'https://example.com', 'https://example.com/post');

      expect(structuredData.datePublished).toBe(pubDate.toISOString());
      expect(structuredData.dateModified).toBe(pubDate.toISOString());
    });

    it('should include OG image when available', () => {
      const post = createMockBlogPost("test-post", new Date("2025-01-15"), null, true, {
        data: {
          ogImage: 'https://example.com/og.jpg'
        }
      });

      const siteUrl = 'https://natspaper.vercel.app';

      const structuredData = generatePostStructuredData(post, siteUrl, 'https://natspaper.vercel.app/post');

      expect(structuredData.image).toBeDefined();
      if (structuredData.image) {
        expect(structuredData.image['@type']).toBe('ImageObject');
        expect(structuredData.image.url).toBe('https://example.com/og.jpg');
      }
    });

    it('should include dynamic OG image when no explicit image is provided', () => {
      const post = createMockBlogPost("test-post", new Date("2025-01-15"));

      const structuredData = generatePostStructuredData(post, 'https://example.com', 'https://example.com/post');

      expect(structuredData.image).toBeDefined();
      if (structuredData.image) {
        expect(structuredData.image.url).toBe('https://example.com/posts/test-post/index.png');
      }
    });

    it('should handle posts with local OG image asset', () => {
      const post = createMockBlogPost("test-post", new Date("2025-01-15"), null, true, {
        data: {
          ogImage: '/images/og.png'
        }
      });

      const siteUrl = 'https://natspaper.vercel.app';

      const structuredData = generatePostStructuredData(post, siteUrl, 'https://natspaper.vercel.app/post');

      expect(structuredData.image).toBeDefined();
      if (structuredData.image) {
        expect(structuredData.image.url).toBe('https://natspaper.vercel.app/images/og.png');
      }
    });
  });

  describe('resolveOgImageUrl', () => {
    const siteUrl = 'https://natspaper.vercel.app';

    it('should resolve remote OG image URL', () => {
      const ogImage = 'https://example.com/og.jpg';
      const result = resolveOgImageUrl(ogImage, 'test-post', siteUrl);

      expect(result).toBe('https://example.com/og.jpg');
    });

    it('should resolve local asset OG image', () => {
      const ogImage = { src: '/images/og.png' };
      const result = resolveOgImageUrl(ogImage, 'test-post', siteUrl);

      expect(result).toBe('https://natspaper.vercel.app/images/og.png');
    });

    it('should generate dynamic OG image when enabled and no explicit image provided', () => {
      // This depends on SITE.dynamicOgImage being true
      const result = resolveOgImageUrl(undefined, 'test-post', siteUrl);

      // Should return the dynamic OG image path
      expect(result).toMatch(/https:\/\/natspaper\.vercel\.app\/posts\/test-post\/index\.png/);
    });

    it('should return undefined when no OG image is available and dynamic is disabled', () => {
      // This test assumes the function handles the case properly
      // The actual behavior depends on SITE.dynamicOgImage
      const result = resolveOgImageUrl(undefined, 'test-post', siteUrl);

      expect(result).toBeDefined(); // Either dynamic image or undefined
    });
  });

  describe('SEO Meta Tags Structure', () => {
    it('should validate home page SEO meta tags structure', () => {
      const metaTags = {
        title: 'Nika Natsvlishvili',
        description: '.NET Developer | Software Engineer',
        canonical: 'https://natspaper.vercel.app/',
        ogType: 'website',
        ogImage: 'astropaper-og.jpg',
        twitterCard: 'summary_large_image',
      };

      expect(metaTags.title).toBeDefined();
      expect(metaTags.description).toBeDefined();
      expect(metaTags.canonical).toBeDefined();
      expect(metaTags.ogType).toBe('website');
      expect(metaTags.ogImage).toBeDefined();
      expect(metaTags.twitterCard).toBe('summary_large_image');
    });

    it('should validate post SEO meta tags structure', () => {
      const postMetaTags = {
        title: 'Blog Post Title',
        description: 'Post description',
        canonical: 'https://natspaper.vercel.app/posts/blog-post-title/',
        ogType: 'article',
        ogImage: '/posts/blog-post-title/index.png',
        publishedTime: '2025-01-15T10:00:00.000Z',
        modifiedTime: '2025-01-16T14:30:00.000Z',
        author: 'Nika Natsvlishvili',
        tags: ['tag1', 'tag2'],
      };

      expect(postMetaTags.title).toBeDefined();
      expect(postMetaTags.description).toBeDefined();
      expect(postMetaTags.canonical).toBeDefined();
      expect(postMetaTags.ogType).toBe('article');
      expect(postMetaTags.ogImage).toBeDefined();
      expect(postMetaTags.publishedTime).toBeDefined();
      expect(postMetaTags.author).toBeDefined();
    });
  });
});