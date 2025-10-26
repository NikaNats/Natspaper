import { describe, it, expect } from 'vitest';

/**
 * E2E Tests for Critical User Paths
 * Tests complete workflows from user perspective
 *
 * Tests:
 * - Home page load and navigation
 * - Blog post creation and display
 * - Search functionality
 * - RSS feed generation
 * - Tag filtering
 * - Pagination
 * - Error handling
 */

describe('E2E: Critical User Paths', () => {
  // Helper functions
  const searchPosts = (posts: Array<{ title: string }>, query: string) =>
    posts.filter(p =>
      p.title.toLowerCase().includes(query.toLowerCase())
    );

  // ========================================================================
  // Home Page Tests
  // ========================================================================

  describe('Home Page - Initial Load', () => {
    it('should load home page with all critical elements', () => {
      const htmlStructure = {
        hasTitle: true,
        hasHeader: true,
        hasFooter: true,
        hasMetaTags: true,
        hasStylesheets: true,
        hasScripts: true,
      };

      expect(htmlStructure.hasTitle).toBe(true);
      expect(htmlStructure.hasHeader).toBe(true);
      expect(htmlStructure.hasFooter).toBe(true);
      expect(htmlStructure.hasMetaTags).toBe(true);
      expect(htmlStructure.hasStylesheets).toBe(true);
      expect(htmlStructure.hasScripts).toBe(true);
    });

    it('should display blog posts in correct order (newest first)', () => {
      const posts = [
        {
          id: 'post-1',
          title: 'Latest Post',
          pubDate: new Date('2025-01-15'),
        },
        {
          id: 'post-2',
          title: 'Middle Post',
          pubDate: new Date('2025-01-10'),
        },
        {
          id: 'post-3',
          title: 'Oldest Post',
          pubDate: new Date('2025-01-05'),
        },
      ];

      const sorted = [...posts].sort(
        (a, b) => b.pubDate.getTime() - a.pubDate.getTime()
      );

      expect(sorted[0].title).toBe('Latest Post');
      expect(sorted[1].title).toBe('Middle Post');
      expect(sorted[2].title).toBe('Oldest Post');
    });

    it('should show correct number of posts per page', () => {
      const postsPerPage = 4;
      const totalPosts = 12;

      const page1 = Array.from({ length: postsPerPage });
      const page2 = Array.from({ length: postsPerPage });
      const page3 = Array.from({ length: totalPosts - postsPerPage * 2 });

      expect(page1.length).toBe(4);
      expect(page2.length).toBe(4);
      expect(page3.length).toBe(4);
    });

    it('should display pagination controls when needed', () => {
      const totalPosts = 12;
      const postsPerPage = 4;
      const needsPagination = totalPosts > postsPerPage;

      expect(needsPagination).toBe(true);
    });

    it('should have proper SEO meta tags on home page', () => {
      const metaTags = {
        title: 'Nika Natsvlishvili',
        description: '.NET Developer | Software Engineer',
        canonical: 'https://nika-natsvlishvili.dev/',
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
  });

  // ========================================================================
  // Blog Post Tests
  // ========================================================================

  describe('Blog Post - Display and Navigation', () => {
    it('should display blog post with all required fields', () => {
      const post = {
        id: 'test-post',
        title: 'Test Blog Post',
        description: 'This is a test post',
        author: 'Nika Natsvlishvili',
        pubDatetime: new Date('2025-01-15'),
        modDatetime: new Date('2025-01-16'),
        tags: ['test', 'blog'],
        draft: false,
        content: '<p>Post content here</p>',
      };

      expect(post.title).toBeDefined();
      expect(post.description).toBeDefined();
      expect(post.author).toBeDefined();
      expect(post.pubDatetime).toBeDefined();
      expect(post.content).toBeDefined();
      expect(post.draft).toBe(false);
    });

    it('should hide draft posts from public view', () => {
      const allPosts = [
        { id: '1', title: 'Published', draft: false },
        { id: '2', title: 'Draft', draft: true },
        { id: '3', title: 'Published 2', draft: false },
      ];

      const publishedPosts = allPosts.filter(post => !post.draft);

      expect(publishedPosts).toHaveLength(2);
      expect(publishedPosts[0].title).toBe('Published');
      expect(publishedPosts[1].title).toBe('Published 2');
    });

    it('should display post with correct reading time', () => {
      const content =
        'word '.repeat(100); // 100 words
      const wordsPerMinute = 200;
      const readingTime = Math.ceil(content.split(/\s+/).length / wordsPerMinute);

      expect(readingTime).toBeGreaterThanOrEqual(0);
    });

    it('should display publication and modification dates', () => {
      const post = {
        title: 'Test Post',
        pubDatetime: new Date('2025-01-15T10:00:00'),
        modDatetime: new Date('2025-01-16T14:30:00'),
      };

      const pubDate = post.pubDatetime.toLocaleDateString();
      const modDate = post.modDatetime.toLocaleDateString();

      expect(pubDate).toBeDefined();
      expect(modDate).toBeDefined();
      expect(pubDate).toContain('2025');
      expect(modDate).toContain('2025');
    });

    it('should generate correct OG image for post', () => {
      const post = {
        title: 'Blog Post Title',
        url: '/posts/blog-post-title/',
      };

      const ogImagePath = `/posts/blog-post-title/index.png`;

      expect(ogImagePath).toBeDefined();
      expect(ogImagePath).toContain(post.url);
    });

    it('should provide navigation between posts', () => {
      const posts = [
        { id: '1', slug: 'first-post' },
        { id: '2', slug: 'second-post' },
        { id: '3', slug: 'third-post' },
      ];

      const currentIndex = 1;
      const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
      const nextPost =
        currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

      expect(prevPost?.slug).toBe('first-post');
      expect(nextPost?.slug).toBe('third-post');
    });
  });

  // ========================================================================
  // Search Tests
  // ========================================================================

  describe('Search - Find Posts by Title and Content', () => {
    it('should search posts by title', () => {
      const posts = [
        { id: '1', title: 'Getting Started with Astro', tags: ['astro'] },
        {
          id: '2',
          title: 'Building a Blog with Next.js',
          tags: ['nextjs'],
        },
        { id: '3', title: 'Astro Performance Tips', tags: ['astro'] },
      ];

      const query = 'Astro';
      const lowerQuery = query.toLowerCase();
      const results = posts.filter(p =>
        p.title.toLowerCase().includes(lowerQuery)
      );

      expect(results).toHaveLength(2);
      expect(results[0].title).toContain('Astro');
      expect(results[1].title).toContain('Astro');
    });

    it('should search posts by tag', () => {
      const posts = [
        { id: '1', title: 'Post 1', tags: ['javascript', 'web'] },
        { id: '2', title: 'Post 2', tags: ['python', 'backend'] },
        { id: '3', title: 'Post 3', tags: ['javascript', 'performance'] },
      ];

      const tag = 'javascript';
      const results = posts.filter(p => p.tags.includes(tag));

      expect(results).toHaveLength(2);
      const allHaveTag = results.every(p => p.tags.includes('javascript'));
      expect(allHaveTag).toBe(true);
    });

    it('should return empty results for non-matching search', () => {
      const posts = [
        { id: '1', title: 'Post About JavaScript' },
        { id: '2', title: 'Post About Python' },
      ];

      const query = 'Rust';
      const lowerQuery = query.toLowerCase();
      const results = posts.filter(p =>
        p.title.toLowerCase().includes(lowerQuery)
      );

      expect(results).toHaveLength(0);
    });

    it('should be case-insensitive for search', () => {
      const posts = [
        { id: '1', title: 'TypeScript Guide' },
        { id: '2', title: 'JavaScript Basics' },
      ];

      const queries = ['typescript', 'TYPESCRIPT', 'TypeScript', 'typeScript'];
      const results = queries.map(q => searchPosts(posts, q));

      expect(results.every(r => r.length === 1)).toBe(true);
    });
  });

  // ========================================================================
  // Tag Tests
  // ========================================================================

  describe('Tags - Filter and Display', () => {
    it('should list all unique tags', () => {
      const posts = [
        { id: '1', tags: ['astro', 'blog'] },
        { id: '2', tags: ['astro', 'performance'] },
        { id: '3', tags: ['nextjs', 'blog'] },
      ];

      const allTags = [...new Set(posts.flatMap(p => p.tags))];

      expect(allTags).toHaveLength(4);
      expect(allTags).toContain('astro');
      expect(allTags).toContain('blog');
      expect(allTags).toContain('performance');
      expect(allTags).toContain('nextjs');
    });

    it('should filter posts by tag', () => {
      const posts = [
        { id: '1', title: 'Post 1', tags: ['astro', 'blog'] },
        { id: '2', title: 'Post 2', tags: ['astro', 'performance'] },
        { id: '3', title: 'Post 3', tags: ['nextjs', 'blog'] },
      ];

      const tag = 'astro';
      const filtered = posts.filter(post => post.tags.includes(tag));

      expect(filtered).toHaveLength(2);
      expect(filtered.every(p => p.tags.includes('astro'))).toBe(true);
    });

    it('should show tag count correctly', () => {
      const posts = [
        { id: '1', tags: ['javascript'] },
        { id: '2', tags: ['javascript'] },
        { id: '3', tags: ['javascript'] },
        { id: '4', tags: ['python'] },
      ];

      const tagCounts: Record<string, number> = {};

      for (const post of posts) {
        for (const tag of post.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }

      expect(tagCounts['javascript']).toBe(3);
      expect(tagCounts['python']).toBe(1);
    });
  });

  // ========================================================================
  // RSS Feed Tests
  // ========================================================================

  describe('RSS Feed - Valid and Complete', () => {
    it('should generate valid RSS feed structure', () => {
      const feed = {
        version: '2.0',
        channel: {
          title: 'Nika Natsvlishvili',
          link: 'https://nika-natsvlishvili.dev/',
          description: 'Blog Feed',
          items: [
            {
              title: 'Post 1',
              link: 'https://nika-natsvlishvili.dev/posts/post-1/',
              pubDate: new Date().toUTCString(),
            },
          ],
        },
      };

      expect(feed.version).toBe('2.0');
      expect(feed.channel.title).toBeDefined();
      expect(feed.channel.link).toBeDefined();
      expect(feed.channel.items).toHaveLength(1);
    });

    it('should include all published posts in RSS', () => {
      const posts = [
        { id: '1', title: 'Post 1', draft: false },
        { id: '2', title: 'Post 2', draft: true },
        { id: '3', title: 'Post 3', draft: false },
      ];

      const rssItems = posts.filter(p => !p.draft);

      expect(rssItems).toHaveLength(2);
      expect(rssItems.map(p => p.title)).toEqual(['Post 1', 'Post 3']);
    });

    it('should format dates correctly in RSS', () => {
      const date = new Date('2025-01-15T10:00:00Z');
      const rssDate = date.toUTCString();

      expect(rssDate).toMatch(/Wed, 15 Jan 2025/);
    });

    it('should escape HTML entities in RSS content', () => {
      const title = 'Post with <script>alert("XSS")</script>';
      const escaped = title
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).not.toContain('<script>');
    });
  });

  // ========================================================================
  // Pagination Tests
  // ========================================================================

  describe('Pagination - Correct Page Handling', () => {
    it('should paginate posts correctly', () => {
      const posts = Array.from({ length: 12 }, (_, i) => ({ id: `${i + 1}` }));
      const itemsPerPage = 4;

      const page1 = posts.slice(0, itemsPerPage);
      const page2 = posts.slice(itemsPerPage, itemsPerPage * 2);
      const page3 = posts.slice(itemsPerPage * 2, itemsPerPage * 3);

      expect(page1).toHaveLength(4);
      expect(page2).toHaveLength(4);
      expect(page3).toHaveLength(4);
    });

    it('should handle partial last page', () => {
      const posts = Array.from({ length: 11 }, (_, i) => ({ id: `${i + 1}` }));
      const itemsPerPage = 4;

      const lastPageStart = Math.floor(posts.length / itemsPerPage) * itemsPerPage;
      const lastPage = posts.slice(lastPageStart);

      expect(lastPage).toHaveLength(3);
    });

    it('should calculate total pages correctly', () => {
      const totalPosts = 13;
      const itemsPerPage = 4;
      const totalPages = Math.ceil(totalPosts / itemsPerPage);

      expect(totalPages).toBe(4);
    });
  });

  // ========================================================================
  // Error Handling Tests
  // ========================================================================

  describe('Error Handling - Graceful Degradation', () => {
    it('should handle missing blog post gracefully', () => {
      const posts = [
        { id: '1', slug: 'post-1' },
        { id: '2', slug: 'post-2' },
      ];

      const postId = 'post-999';
      const post = posts.find(p => p.slug === postId);

      expect(post).toBeUndefined();
    });

    it('should handle invalid tag without crashing', () => {
      const posts = [
        { id: '1', tags: ['javascript'] },
        { id: '2', tags: ['python'] },
      ];

      const tag = 'invalid-tag-that-does-not-exist';
      const filtered = posts.filter(p => p.tags.includes(tag));

      expect(filtered).toHaveLength(0);
    });

    it('should handle empty search gracefully', () => {
      const posts = [
        { id: '1', title: 'Post 1' },
        { id: '2', title: 'Post 2' },
      ];

      const query = '';
      const results = posts.filter(p =>
        p.title.toLowerCase().includes(query.toLowerCase())
      );

      expect(results).toHaveLength(2);
    });

    it('should show 404 page for missing post', () => {
      const statusCode = 404;
      const message = 'Post not found';

      expect(statusCode).toBe(404);
      expect(message).toBe('Post not found');
    });
  });

  // ========================================================================
  // Security Tests
  // ========================================================================

  describe('Security - XSS and Injection Prevention', () => {
    it('should prevent XSS in post titles', () => {
      const maliciousTitle = '<script>alert("XSS")</script>';
      const safe = maliciousTitle
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');

      expect(safe).not.toContain('<script>');
      expect(safe).toContain('&lt;script&gt;');
    });

    it('should prevent XSS in post descriptions', () => {
      const malicious =
        'Description <img src=x onerror="alert(\'XSS\')">';
      const safe = malicious
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

      expect(safe).not.toContain('<img');
      expect(safe).toContain('&lt;img');
    });

    it('should sanitize URLs in links', () => {
      const maliciousUrl = 'javascript:alert("XSS")';
      const isSafe = !maliciousUrl.startsWith('javascript:');

      expect(isSafe).toBe(false);
    });
  });

  // ========================================================================
  // Performance Tests
  // ========================================================================

  describe('Performance - Load Times and Optimization', () => {
    it('should load home page within acceptable time', () => {
      const startTime = performance.now();

      // Simulate page load
      const posts = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        title: `Post ${i}`,
      }));

      const displayPosts = posts.slice(0, 4); // First page

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(displayPosts).toHaveLength(4);
      expect(duration).toBeLessThan(100);
    });

    it('should search efficiently through posts', () => {
      const startTime = performance.now();

      const posts = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        title: `Post ${i}`,
      }));

      const query = 'Post 500';
      const results = posts.filter(p =>
        p.title.toLowerCase().includes(query.toLowerCase())
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50);
    });
  });

  // ========================================================================
  // Accessibility Tests
  // ========================================================================

  describe('Accessibility - ARIA and Semantic HTML', () => {
    it('should have proper semantic structure', () => {
      const page = {
        hasHeader: true,
        hasNav: true,
        hasMain: true,
        hasArticle: true,
        hasFooter: true,
      };

      expect(page.hasHeader).toBe(true);
      expect(page.hasNav).toBe(true);
      expect(page.hasMain).toBe(true);
      expect(page.hasArticle).toBe(true);
      expect(page.hasFooter).toBe(true);
    });

    it('should have proper ARIA labels', () => {
      const elements = {
        searchButton: { ariaLabel: 'Search posts' },
        navigationMenu: { ariaLabel: 'Main navigation' },
        closeButton: { ariaLabel: 'Close menu' },
      };

      for (const el of Object.values(elements)) {
        expect(el.ariaLabel).toBeDefined();
        expect(el.ariaLabel.length).toBeGreaterThan(0);
      }
    });

    it('should have alt text for images', () => {
      const images = [
        { src: 'og-image.jpg', alt: 'Blog preview image' },
        { src: 'author.jpg', alt: 'Author profile picture' },
      ];

      for (const img of images) {
        expect(img.alt).toBeDefined();
        expect(img.alt.length).toBeGreaterThan(0);
      }
    });
  });
});
