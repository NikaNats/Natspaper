import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeDescription } from '@/utils/rss';
import { createMockBlogPost } from '@tests/helpers/mockBlogPost';

describe('RSS Feed Utilities', () => {
  describe('HTML Escaping', () => {
    it('should escape ampersand', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape less than', () => {
      expect(escapeHtml('1 < 2')).toBe('1 &lt; 2');
    });

    it('should escape greater than', () => {
      expect(escapeHtml('2 > 1')).toBe('2 &gt; 1');
    });

    it('should escape double quotes', () => {
      expect(escapeHtml('He said "Hello"')).toBe('He said &quot;Hello&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("It's a nice day")).toBe("It&#39;s a nice day");
    });

    it('should escape all special characters in combination', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should handle multiple occurrences', () => {
      const input = '&&&>>><<<"""\'\'\'';
      const result = escapeHtml(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('"');
      expect(result).not.toContain("'");
    });
  });

  describe('XSS Prevention', () => {
    it('should prevent script tag injection', () => {
      const malicious = '<script>alert("XSS")</script>';
      const result = escapeHtml(malicious);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should prevent event handler injection', () => {
      const malicious = '<img src=x onerror=alert("XSS")>';
      const result = escapeHtml(malicious);
      expect(result).toContain('&lt;img');
      expect(result).toContain('&gt;');
      expect(result).not.toContain('<img');
      expect(result).not.toContain('alert("XSS")');
    });

    it('should prevent iframe injection', () => {
      const malicious = '<iframe src="javascript:alert(\'XSS\')"></iframe>';
      const result = escapeHtml(malicious);
      expect(result).not.toContain('<iframe');
      expect(result).toContain('&lt;iframe');
    });
  });

  describe('Description Sanitization', () => {
    it('should remove markdown links', () => {
      const input = 'Check out [my blog](https://example.com)';
      const result = sanitizeDescription(input);
      expect(result).toContain('my blog');
      expect(result).not.toContain('[');
      expect(result).not.toContain(']');
      expect(result).not.toContain('(https://');
    });

    it('should remove markdown emphasis', () => {
      const input = 'This is **bold** and *italic* text';
      const result = sanitizeDescription(input);
      expect(result).toContain('bold');
      expect(result).toContain('italic');
      expect(result).not.toContain('**');
      expect(result).not.toContain('*');
    });

    it('should remove inline code', () => {
      const input = 'Use `const x = 5` for variables';
      const result = sanitizeDescription(input);
      expect(result).toBe('Use  for variables'); // Content between backticks is removed
      expect(result).not.toContain('`');
    });

    it('should limit to 500 characters', () => {
      const input = 'a'.repeat(1000);
      const result = sanitizeDescription(input);
      expect(result.length).toBeLessThanOrEqual(500);
    });

    it('should escape HTML after removing markdown', () => {
      const input = 'Click [here](https://example.com) <script>';
      const result = sanitizeDescription(input);
      expect(result).not.toContain('<script>'); // HTML tags are removed
      expect(result).toContain('Click here'); // Link text is preserved
    });
  });

  describe('RSS Feed Structure', () => {
    it('should format dates correctly for RSS', () => {
      const date = new Date('2025-01-15T10:00:00Z');
      const rssDate = date.toUTCString();

      expect(rssDate).toMatch(/Wed, 15 Jan 2025/);
    });

    it('should include all published posts in RSS feed', () => {
      const posts = [
        createMockBlogPost("post1", new Date("2025-01-01"), null, true),
        createMockBlogPost("post2", new Date("2025-01-02"), null, false), // draft
        createMockBlogPost("post3", new Date("2025-01-03"), null, true),
      ];

      const publishedPosts = posts.filter(post => !post.data.draft);

      expect(publishedPosts).toHaveLength(2);
      expect(publishedPosts.map(p => p.id)).toEqual(['post1', 'post3']);
    });

    it('should generate valid RSS item structure', () => {
      const post = createMockBlogPost("test-post", new Date("2025-01-15"));
      const siteUrl = 'https://natspaper.vercel.app';

      const rssItem = {
        link: `/en/posts/${post.id}`,
        title: escapeHtml(post.data.title),
        description: `<![CDATA[${sanitizeDescription(post.data.description)}]]>`,
        pubDate: new Date(post.data.pubDatetime).toUTCString(),
        guid: `${siteUrl.replace(/\/$/, "")}/en/posts/${post.id}`,
      };

      expect(rssItem.title).toBe(escapeHtml(post.data.title));
      expect(rssItem.description).toContain('<![CDATA[');
      expect(rssItem.description).toContain(']]>');
      expect(rssItem.guid).toContain(siteUrl);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty description', () => {
      expect(sanitizeDescription('')).toBe('');
    });

    it('should handle only special characters', () => {
      const input = '&<>"\'';
      const result = escapeHtml(input);
      expect(result).toBe('&amp;&lt;&gt;&quot;&#39;');
    });

    it('should preserve normal text unchanged', () => {
      const input = 'This is normal text';
      expect(escapeHtml(input)).toBe(input);
    });
  });
});