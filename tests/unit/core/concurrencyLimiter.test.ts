import { describe, it, expect } from "vitest";
import {
  ConcurrencyLimiter,
  TimeoutError,
  AbortError,
} from "@/utils/core/concurrencyLimiter";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

describe("ConcurrencyLimiter", () => {
  // ── Constructor validation ──────────────────────────────────────────

  describe("constructor", () => {
    it("should accept valid positive integers", () => {
      expect(() => new ConcurrencyLimiter(1)).not.toThrow();
      expect(() => new ConcurrencyLimiter(8)).not.toThrow();
    });

    it.each([0, -1, 1.5, NaN, Infinity])(
      "should throw RangeError for %s",
      value => {
        expect(() => new ConcurrencyLimiter(value)).toThrow(RangeError);
      },
    );
  });

  // ── Core scheduling ─────────────────────────────────────────────────

  describe("run()", () => {
    it("should execute immediately when under limit", async () => {
      const limiter = new ConcurrencyLimiter(2);
      const result = await limiter.run(async () => "ok");
      expect(result).toBe("ok");
    });

    it("should enforce FIFO order with maxConcurrent=1", async () => {
      const limiter = new ConcurrencyLimiter(1);
      const order: number[] = [];

      const makeTask = (id: number) => async () => {
        order.push(id);
        await delay(5);
        return id;
      };

      const results = await Promise.all([
        limiter.run(makeTask(1)),
        limiter.run(makeTask(2)),
        limiter.run(makeTask(3)),
      ]);

      expect(results).toEqual([1, 2, 3]);
      expect(order).toEqual([1, 2, 3]); // strict FIFO
    });

    it("should never exceed maxConcurrent", async () => {
      const limiter = new ConcurrencyLimiter(3);
      let peak = 0;
      let active = 0;

      const task = async () => {
        active++;
        peak = Math.max(peak, active);
        await delay(10);
        active--;
      };

      await Promise.all(Array.from({ length: 20 }, () => limiter.run(task)));
      expect(peak).toBeLessThanOrEqual(3);
    });

    it("should propagate errors from fn", async () => {
      const limiter = new ConcurrencyLimiter(1);
      await expect(
        limiter.run(async () => {
          throw new Error("boom");
        }),
      ).rejects.toThrow("boom");
    });

    it("should release slot after error", async () => {
      const limiter = new ConcurrencyLimiter(1);

      await limiter.run(async () => {}).catch(() => {});
      expect(limiter.getStats().running).toBe(0);

      // Slot is free — next call should not hang
      const result = await limiter.run(async () => "recovered");
      expect(result).toBe("recovered");
    });
  });

  // ── Stats ───────────────────────────────────────────────────────────

  describe("getStats()", () => {
    it("should track completed and failed counts", async () => {
      const limiter = new ConcurrencyLimiter(2);

      await limiter.run(async () => "a");
      await limiter.run(async () => "b");
      await limiter
        .run(async () => {
          throw new Error("fail");
        })
        .catch(() => {});

      const stats = limiter.getStats();
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.running).toBe(0);
      expect(stats.queued).toBe(0);
    });

    it("should report queued count accurately", async () => {
      const limiter = new ConcurrencyLimiter(1);
      let resolveFirst!: () => void;
      const gate = new Promise<void>(r => {
        resolveFirst = r;
      });

      // Occupy the only slot
      const first = limiter.run(async () => {
        await gate;
      });

      // These will queue
      const second = limiter.run(async () => "b");
      const third = limiter.run(async () => "c");

      // Allow microtasks to settle
      await delay(0);
      expect(limiter.getStats().queued).toBe(2);

      resolveFirst();
      await Promise.all([first, second, third]);
      expect(limiter.getStats().queued).toBe(0);
    });
  });

  // ── AbortSignal ─────────────────────────────────────────────────────

  describe("AbortSignal", () => {
    it("should reject immediately if already aborted", async () => {
      const limiter = new ConcurrencyLimiter(1);
      const controller = new AbortController();
      controller.abort();

      await expect(
        limiter.run(async () => "never", { signal: controller.signal }),
      ).rejects.toThrow(AbortError);
    });

    it("should remove queued task on abort", async () => {
      const limiter = new ConcurrencyLimiter(1);
      let resolveFirst!: () => void;
      const gate = new Promise<void>(r => {
        resolveFirst = r;
      });

      const first = limiter.run(async () => {
        await gate;
      });

      const controller = new AbortController();
      const second = limiter.run(async () => "should not run", {
        signal: controller.signal,
      });

      await delay(0);
      expect(limiter.getStats().queued).toBe(1);

      // Abort while queued
      controller.abort();

      await expect(second).rejects.toThrow(AbortError);
      expect(limiter.getStats().queued).toBe(0);

      resolveFirst();
      await first;
    });
  });

  // ── Timeout ─────────────────────────────────────────────────────────

  describe("timeout", () => {
    it("should reject with TimeoutError when exceeded", async () => {
      const limiter = new ConcurrencyLimiter(1);

      await expect(
        limiter.run(() => delay(500).then(() => "late"), {
          timeoutMs: 50,
        }),
      ).rejects.toThrow(TimeoutError);
    });

    it("should resolve normally within timeout", async () => {
      const limiter = new ConcurrencyLimiter(1);
      const result = await limiter.run(
        async () => {
          await delay(10);
          return "fast";
        },
        { timeoutMs: 5000 },
      );
      expect(result).toBe("fast");
    });
  });

  // ── onIdle ──────────────────────────────────────────────────────────

  describe("onIdle()", () => {
    it("should resolve immediately when idle", async () => {
      const limiter = new ConcurrencyLimiter(2);
      await expect(limiter.onIdle()).resolves.toBeUndefined();
    });

    it("should resolve after all tasks complete", async () => {
      const limiter = new ConcurrencyLimiter(1);
      const results: string[] = [];

      const p1 = limiter.run(async () => {
        await delay(10);
        results.push("a");
      });
      const p2 = limiter.run(async () => {
        await delay(10);
        results.push("b");
      });

      await limiter.onIdle();
      expect(results).toEqual(["a", "b"]);

      await Promise.all([p1, p2]);
    });
  });
});