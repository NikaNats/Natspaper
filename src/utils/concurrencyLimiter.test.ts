import { describe, it, expect, vi } from "vitest";
import { ConcurrencyLimiter } from "./core/concurrencyLimiter";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("ConcurrencyLimiter", () => {
  describe("constructor", () => {
    it("should create limiter with valid maxConcurrent", () => {
      const limiter = new ConcurrencyLimiter(1);
      expect(limiter.getStats().maxConcurrent).toBe(1);
    });

    it("should throw error if maxConcurrent < 1", () => {
      expect(() => new ConcurrencyLimiter(0)).toThrow(
        "maxConcurrent must be at least 1"
      );
      expect(() => new ConcurrencyLimiter(-1)).toThrow(
        "maxConcurrent must be at least 1"
      );
    });
  });

  describe("run()", () => {
    it("should execute function immediately when under limit", async () => {
      const limiter = new ConcurrencyLimiter(2);
      const fn = vi.fn(async () => "result");

      const result = await limiter.run(fn);

      expect(result).toBe("result");
      expect(fn).toHaveBeenCalledOnce();
    });

    it("should execute multiple functions concurrently up to limit", async () => {
      const limiter = new ConcurrencyLimiter(2);
      const execution: number[] = [];

      const fn1 = vi.fn(async () => {
        execution.push(1);
        await delay(10);
        execution.push(-1);
        return "result1";
      });

      const fn2 = vi.fn(async () => {
        execution.push(2);
        await delay(10);
        execution.push(-2);
        return "result2";
      });

      const fn3 = vi.fn(async () => {
        execution.push(3);
        await delay(10);
        execution.push(-3);
        return "result3";
      });

      const promises = [limiter.run(fn1), limiter.run(fn2), limiter.run(fn3)];

      const [result1, result2, result3] = await Promise.all(promises);

      expect(result1).toBe("result1");
      expect(result2).toBe("result2");
      expect(result3).toBe("result3");

      // Verify that at most 2 are running concurrently
      let maxConcurrent = 0;
      const running: Set<number> = new Set();

      for (const event of execution) {
        if (event > 0) {
          running.add(event);
        } else {
          running.delete(-event);
        }
        maxConcurrent = Math.max(maxConcurrent, running.size);
      }

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it("should serialize execution when maxConcurrent=1", async () => {
      const limiter = new ConcurrencyLimiter(1);
      const execution: number[] = [];

      const fn1 = vi.fn(async () => {
        execution.push(1);
        await delay(10);
        execution.push(-1);
        return "result1";
      });

      const fn2 = vi.fn(async () => {
        execution.push(2);
        await delay(10);
        execution.push(-2);
        return "result2";
      });

      const fn3 = vi.fn(async () => {
        execution.push(3);
        await delay(10);
        execution.push(-3);
        return "result3";
      });

      const promises = [limiter.run(fn1), limiter.run(fn2), limiter.run(fn3)];

      const [result1, result2, result3] = await Promise.all(promises);

      expect(result1).toBe("result1");
      expect(result2).toBe("result2");
      expect(result3).toBe("result3");

      // Verify strict serialization: only 1 at a time
      let maxConcurrent = 0;
      const running: Set<number> = new Set();

      for (const event of execution) {
        if (event > 0) {
          running.add(event);
        } else {
          running.delete(-event);
        }
        maxConcurrent = Math.max(maxConcurrent, running.size);
      }

      expect(maxConcurrent).toBe(1);
    });

    it("should return function result", async () => {
      const limiter = new ConcurrencyLimiter(1);

      const result = await limiter.run(async () => ({ data: "test" }));

      expect(result).toEqual({ data: "test" });
    });

    it("should propagate function errors", async () => {
      const limiter = new ConcurrencyLimiter(1);
      const error = new Error("Test error");

      await expect(
        limiter.run(async () => {
          throw error;
        })
      ).rejects.toThrow("Test error");
    });

    it("should release slot after function completes (success)", async () => {
      const limiter = new ConcurrencyLimiter(1);
      let stats = limiter.getStats();
      expect(stats.running).toBe(0);

      await limiter.run(async () => {
        stats = limiter.getStats();
        expect(stats.running).toBe(1);
      });

      stats = limiter.getStats();
      expect(stats.running).toBe(0);
    });

    it("should release slot after function completes (error)", async () => {
      const limiter = new ConcurrencyLimiter(1);
      let stats = limiter.getStats();
      expect(stats.running).toBe(0);

      try {
        await limiter.run(async () => {
          stats = limiter.getStats();
          expect(stats.running).toBe(1);
          throw new Error("Test");
        });
      } catch {
        // Expected error
      }

      stats = limiter.getStats();
      expect(stats.running).toBe(0);
    });
  });

  describe("getStats()", () => {
    it("should return correct stats initially", () => {
      const limiter = new ConcurrencyLimiter(3);
      const stats = limiter.getStats();

      expect(stats).toEqual({
        running: 0,
        queued: 0,
        maxConcurrent: 3,
      });
    });

    it("should update running count during execution", async () => {
      const limiter = new ConcurrencyLimiter(2);
      let statsInsideRun: ReturnType<typeof limiter.getStats> | null = null;

      await limiter.run(async () => {
        statsInsideRun = limiter.getStats();
      });

      expect(statsInsideRun).toEqual({
        running: 1,
        queued: 0,
        maxConcurrent: 2,
      });
    });
  });

  describe("concurrent stress test", () => {
    it("should handle many concurrent operations with limit", async () => {
      const limiter = new ConcurrencyLimiter(3);
      const operations: Promise<number>[] = [];

      for (let i = 0; i < 20; i++) {
        operations.push(limitedDelay(limiter, i));
      }

      const results = await Promise.all(operations);

      expect(results).toHaveLength(20);
      expect(results).toEqual([...new Array(20).keys()]);
    });

    it("should handle rapid fire operations with maxConcurrent=1", async () => {
      const limiter = new ConcurrencyLimiter(1);
      let activeCount = 0;
      let maxActive = 0;

      const operations: Promise<void>[] = [];

      for (let i = 0; i < 10; i++) {
        operations.push(
          limiter.run(async () => {
            activeCount++;
            maxActive = Math.max(maxActive, activeCount);
            await delay(1);
            activeCount--;
          })
        );
      }

      await Promise.all(operations);

      expect(maxActive).toBe(1);
    });
  });
});

async function limitedDelay(
  limiter: ConcurrencyLimiter,
  value: number
): Promise<number> {
  return limiter.run(async () => {
    await delay(5);
    return value;
  });
}
