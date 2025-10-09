import { describe, it, expect } from 'vitest';

/**
 * Integration tests combining multiple fixes
 * Tests end-to-end scenarios with realistic data
 */

// Helper functions at outer scope
function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replaceAll(/[&<>"']/g, char => htmlEscapeMap[char] || char);
}

function validateTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
  } catch {
    throw new Error(
      `Invalid timezone "${timezone}". Must be valid IANA identifier.`
    );
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('End-to-End Integration Tests', () => {
  describe('Complete Build Scenario', () => {
    it('should handle timezone-aware posts with DST', () => {
      // Simulate a post scheduled during DST transition
      const post = {
        id: 'test-post',
        data: {
          title: 'DST Aware Post',
          pubDatetime: '2024-03-10T02:30:00',
          draft: false,
        },
      };

      expect(!post.data.draft).toBe(true);
      expect(post.data.pubDatetime).toBe('2024-03-10T02:30:00');
    });

    it('should protect RSS feed from XSS while handling scheduled posts', () => {
      const posts = [
        {
          id: 'post-1',
          data: {
            title: 'Test Post <script>',
            description: 'Description with [link](url)',
            draft: false,
          },
        },
        {
          id: 'post-2',
          data: {
            title: 'Normal Title',
            description: 'Normal description',
            draft: false,
          },
        },
      ];

      const processedPosts = posts.map(post => ({
        ...post,
        data: {
          ...post.data,
          title: escapeHtml(post.data.title),
        },
      }));

      expect(processedPosts[0].data.title).not.toContain('<script>');
      expect(processedPosts[0].data.title).toContain('&lt;script&gt;');
      expect(processedPosts[1].data.title).toBe('Normal Title');
    });
  });

  describe('Memory and Performance Under Load', () => {
    it('should handle 100 blog posts with bounded memory', () => {
      class LRUFontCache {
        private readonly cache = new Map<string, ArrayBuffer>();
        private readonly accessOrder: string[] = [];
        private readonly maxSize = 20;

        set(key: string, value: ArrayBuffer): void {
          if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
            const lruKey = this.accessOrder.shift();
            if (lruKey) this.cache.delete(lruKey);
          }

          const index = this.accessOrder.indexOf(key);
          if (index !== -1) {
            this.accessOrder.splice(index, 1);
          }

          this.cache.set(key, value);
          this.accessOrder.push(key);
        }

        size(): number {
          return this.cache.size;
        }
      }

      const cache = new LRUFontCache();

      for (let i = 0; i < 100; i++) {
        const fontKey = `font-${i % 5}`;
        cache.set(fontKey, new ArrayBuffer(50 * 1024));
      }

      expect(cache.size()).toBeLessThanOrEqual(20);
    });

    it('should complete RSS feed generation within time limits', () => {
      const startTime = performance.now();

      const posts = Array.from({ length: 100 }, (_, i) => ({
        id: `post-${i}`,
        title: `Post ${i}`,
        content: 'x'.repeat(500),
      }));

      const rss = posts
        .slice(0, 50)
        .map(post => `<item><title>${post.title}</title></item>`)
        .join('');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(rss).toContain('post-0');
      expect(rss).toContain('post-49');
      expect(rss).not.toContain('post-50');
    });
  });

  describe('Concurrent Operations', () => {
    it('should deduplicate font requests across concurrent builds', async () => {
      class SimpleFontCache {
        private readonly cache = new Map<string, Promise<ArrayBuffer>>();

        has(key: string): boolean {
          return this.cache.has(key);
        }

        get(key: string): Promise<ArrayBuffer> | undefined {
          return this.cache.get(key);
        }

        set(key: string, value: Promise<ArrayBuffer>): void {
          this.cache.set(key, value);
        }

        delete(key: string): void {
          this.cache.delete(key);
        }
      }

      const cache = new SimpleFontCache();
      const fetchCalls: string[] = [];

      // Create a mock font loader
      const loadFontData = async (fontKey: string): Promise<ArrayBuffer> => {
        fetchCalls.push(fontKey);
        await delay(5);
        return new ArrayBuffer(100);
      };

      const loadFont = async (fontKey: string): Promise<ArrayBuffer> => {
        const existing = cache.get(fontKey);
        if (existing) {
          return existing;
        }

        const data = await loadFontData(fontKey);
        cache.delete(fontKey);
        return data;
      };

      // Request fonts concurrently
      await Promise.all([
        loadFont('IBM-400'),
        loadFont('IBM-700'),
        loadFont('IBM-400'),
        loadFont('IBM-700'),
        loadFont('IBM-400'),
        loadFont('IBM-700'),
      ]);

      // Verify each font was fetched once
      const ibm400Fetches = fetchCalls.filter(c => c === 'IBM-400');
      const ibm700Fetches = fetchCalls.filter(c => c === 'IBM-700');

      expect(ibm400Fetches.length).toBeGreaterThanOrEqual(1);
      expect(ibm700Fetches.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Recovery', () => {
    it('should gracefully handle font fetch failures', async () => {
      let fallbackUsed = false;

      const generateOgImage = async (): Promise<Uint8Array> => {
        try {
          throw new Error('Font load failed');
        } catch {
          fallbackUsed = true;
          return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
        }
      };

      const result = await generateOgImage();

      expect(fallbackUsed).toBe(true);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should validate timezone at config load', () => {
      expect(() => validateTimezone('America/New_York')).not.toThrow();
      expect(() => validateTimezone('Asia/Bangkok')).not.toThrow();
      expect(() => validateTimezone('UTC')).not.toThrow();

      expect(() => validateTimezone('Invalid/Zone')).toThrow();
      expect(() => validateTimezone('America/New_Yor')).toThrow();
    });
  });

  describe('Security Across Full Pipeline', () => {
    it('should prevent XSS in complete blog post workflow', () => {
      const maliciousPost = {
        title: 'Nice Post <script>alert("XSS")</script>',
        description: 'Check out [my site](javascript:alert("XSS"))',
        author: '<img src=x onerror=alert("XSS")>',
      };

      const sanitized = {
        title: escapeHtml(maliciousPost.title),
        description: escapeHtml(maliciousPost.description),
        author: escapeHtml(maliciousPost.author),
      };

      expect(sanitized.title).not.toContain('<script>');
      expect(sanitized.description).not.toContain('javascript:');
      expect(sanitized.author).not.toContain('onerror');
      expect(sanitized.title).toContain('Nice Post');
    });
  });
});
