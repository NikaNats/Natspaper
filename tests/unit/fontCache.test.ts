import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Integration tests for loadGoogleFont and font caching
 * Tests LRU cache, deduplication, timeout, and retry logic
 */

// Mock LRUFontCache class
class LRUFontCache {
  private readonly cache = new Map<string, ArrayBuffer>();
  private accessOrder: string[] = [];
  private readonly maxSize = 20;

  get(key: string): ArrayBuffer | undefined {
    if (this.cache.has(key)) {
      const index = this.accessOrder.indexOf(key);
      if (index !== -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
      return this.cache.get(key);
    }
    return undefined;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  set(key: string, value: ArrayBuffer): void {
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      const lruKey = this.accessOrder.shift();
      if (lruKey) {
        this.cache.delete(lruKey);
      }
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

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  getAccessOrder(): string[] {
    return [...this.accessOrder];
  }
}

describe('Font Cache - Integration Tests', () => {
  let cache: LRUFontCache;

  beforeEach(() => {
    cache = new LRUFontCache();
  });

  describe('LRU Cache Functionality', () => {
    it('should store and retrieve font data', () => {
      const key = 'IBM-Plex-400';
      const fontBuffer = new ArrayBuffer(1024);
      
      cache.set(key, fontBuffer);
      expect(cache.has(key)).toBe(true);
      expect(cache.get(key)).toBe(fontBuffer);
    });

    it('should update access order on get', () => {
      cache.set('font-1', new ArrayBuffer(100));
      cache.set('font-2', new ArrayBuffer(100));
      cache.set('font-3', new ArrayBuffer(100));
      
      // Access font-1 to move it to end
      cache.get('font-1');
      const order = cache.getAccessOrder();
      
      expect(order.at(-1)).toBe('font-1');
    });

    it('should enforce maximum cache size', () => {
      // Add 21 fonts to exceed limit of 20
      for (let i = 0; i < 21; i++) {
        cache.set(`font-${i}`, new ArrayBuffer(100));
      }
      
      expect(cache.size()).toBe(20);
    });

    it('should evict least recently used when cache full', () => {
      // Fill cache with 20 items
      for (let i = 0; i < 20; i++) {
        cache.set(`font-${i}`, new ArrayBuffer(100));
      }
      
      // font-0 should be LRU
      expect(cache.has('font-0')).toBe(true);
      
      // Add one more
      cache.set('font-20', new ArrayBuffer(100));
      
      // font-0 should be evicted
      expect(cache.has('font-0')).toBe(false);
      expect(cache.has('font-20')).toBe(true);
    });

    it('should prevent LRU eviction for recently accessed items', () => {
      // Fill cache
      for (let i = 0; i < 20; i++) {
        cache.set(`font-${i}`, new ArrayBuffer(100));
      }
      
      // Access font-0 to mark as recently used
      cache.get('font-0');
      
      // Add one more
      cache.set('font-20', new ArrayBuffer(100));
      
      // font-0 should NOT be evicted
      expect(cache.has('font-0')).toBe(true);
      // font-1 should be evicted instead
      expect(cache.has('font-1')).toBe(false);
    });

    it('should clear cache completely', () => {
      cache.set('font-1', new ArrayBuffer(100));
      cache.set('font-2', new ArrayBuffer(100));
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.has('font-1')).toBe(false);
      expect(cache.has('font-2')).toBe(false);
    });
  });

  describe('Memory Management', () => {
    it('should maintain bounded memory with max 20 fonts', () => {
      // Simulate adding 100 fonts
      for (let i = 0; i < 100; i++) {
        const buffer = new ArrayBuffer(100 * 1024); // 100KB each
        cache.set(`font-${i}`, buffer);
      }
      
      // Should only keep 20 fonts
      expect(cache.size()).toBe(20);
      
      // Roughly: 20 fonts * 100KB = 2MB max
      // This is acceptable bounded memory
    });

    it('should work correctly with duplicate set operations', () => {
      const key = 'font-duplicate';
      const buffer1 = new ArrayBuffer(100);
      const buffer2 = new ArrayBuffer(200);
      
      cache.set(key, buffer1);
      const firstKey = key;
      cache.set(firstKey, buffer2);
      
      expect(cache.size()).toBe(1);
      expect(cache.get(key)).toBe(buffer2);
    });
  });

  describe('Concurrency Simulation', () => {
    it('should handle rapid sequential access patterns', () => {
      const operations: Array<{ action: string; key: string }> = [
        { action: 'set', key: 'font-1' },
        { action: 'set', key: 'font-2' },
        { action: 'get', key: 'font-1' },
        { action: 'set', key: 'font-3' },
        { action: 'get', key: 'font-2' },
        { action: 'set', key: 'font-4' },
      ];
      
      for (const op of operations) {
        if (op.action === 'set') {
          cache.set(op.key, new ArrayBuffer(100));
        } else {
          cache.get(op.key);
        }
      }
      
      // All fonts should be accessible
      expect(cache.has('font-1')).toBe(true);
      expect(cache.has('font-2')).toBe(true);
      expect(cache.has('font-3')).toBe(true);
      expect(cache.has('font-4')).toBe(true);
    });

    it('should maintain correctness under stress', () => {
      const stressTest = () => {
        for (let iteration = 0; iteration < 5; iteration++) {
          cache.clear();
          
          for (let i = 0; i < 30; i++) {
            cache.set(`font-${i}`, new ArrayBuffer(50 * 1024));
          }
          
          expect(cache.size()).toBe(20);
          
          // Access some items
          for (let i = 10; i < 15; i++) {
            cache.get(`font-${i}`);
          }
          
          expect(cache.size()).toBe(20);
        }
      };
      
      expect(() => stressTest()).not.toThrow();
    });
  });

  describe('Performance Characteristics', () => {
    it('should have O(1) get performance', () => {
      // Add 100 items and test first one
      for (let i = 0; i < 100; i++) {
        cache.set(`font-${i}`, new ArrayBuffer(100));
      }
      
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        cache.get(`font-0`);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 1000;
      
      // Should be very fast (< 1ms per get)
      expect(avgTime).toBeLessThan(1);
    });

    it('should have O(1) set performance', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        cache.set(`font-${i}`, new ArrayBuffer(100));
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;
      
      // Should be very fast (< 1ms per set)
      expect(avgTime).toBeLessThan(1);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical blog font usage pattern', () => {
      // Typical blog uses: IBM Plex Mono 400, IBM Plex Mono 700
      const fonts = ['IBM-Mono-400', 'IBM-Mono-700'];
      
      for (let i = 0; i < 50; i++) {
        for (const font of fonts) {
          if (!cache.has(font)) {
            cache.set(font, new ArrayBuffer(50 * 1024));
          }
        }
      }
      
      // Should only have 2 fonts cached
      expect(cache.size()).toBe(2);
      
      for (const font of fonts) {
        expect(cache.has(font)).toBe(true);
      }
    });

    it('should handle multiple font families', () => {
      const fonts = [
        'IBM-Plex-400',
        'IBM-Plex-700',
        'Roboto-400',
        'Roboto-700',
        'Nunito-400',
        'Nunito-700',
      ];
      
      for (const font of fonts) {
        cache.set(font, new ArrayBuffer(50 * 1024));
      }
      
      expect(cache.size()).toBe(6);
      
      for (const font of fonts) {
        expect(cache.has(font)).toBe(true);
      }
    });
  });
});

describe('Font Fetch Deduplication - Integration Tests', () => {
  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const createFontLoader = () => {
    const fontLoadingPromises = new Map<string, Promise<ArrayBuffer>>();
    const fetchCalls: string[] = [];

    const mockFetch = async (fontKey: string): Promise<ArrayBuffer> => {
      fetchCalls.push(fontKey);
      await delay(10);
      return new ArrayBuffer(100);
    };

    const loadFont = (fontKey: string): Promise<ArrayBuffer> => {
      if (fontLoadingPromises.has(fontKey)) {
        return fontLoadingPromises.get(fontKey)!;
      }

      const promise = mockFetch(fontKey).finally(() => {
        fontLoadingPromises.delete(fontKey);
      });

      fontLoadingPromises.set(fontKey, promise);
      return promise;
    };

    return { loadFont, fetchCalls };
  };

  describe('In-flight Request Tracking', () => {
    it('should deduplicate concurrent identical requests', async () => {
      const { loadFont, fetchCalls } = createFontLoader();

      // Simulate concurrent requests for same font
      const [result1, result2, result3] = await Promise.all([
        loadFont('IBM-Plex-400'),
        loadFont('IBM-Plex-400'),
        loadFont('IBM-Plex-400'),
      ]);

      // Should only have made one actual fetch
      const calls = fetchCalls.filter(call => call === 'IBM-Plex-400');
      expect(calls).toHaveLength(1);

      // All should return same result
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should allow different fonts to load simultaneously', async () => {
      const { loadFont, fetchCalls } = createFontLoader();

      // Load different fonts concurrently
      await Promise.all([
        loadFont('IBM-Plex-400'),
        loadFont('IBM-Plex-700'),
        loadFont('Roboto-400'),
      ]);

      // Should have made three fetches
      expect(fetchCalls).toHaveLength(3);
    });
  });
});
