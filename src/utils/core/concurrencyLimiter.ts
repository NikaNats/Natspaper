import { cpus } from "node:os";

/**
 * Concurrency Limiter - Controls the maximum number of concurrent async operations.
 *
 * Purpose: Prevent memory bloat from concurrent Resvg instances during OG image generation.
 * When multiple OG image routes are accessed simultaneously during build or deployment,
 * uncontrolled concurrency can cause:
 * - Rapid memory consumption (each Resvg instance uses significant native memory)
 * - Out-of-memory errors during builds with many posts
 * - Poor performance under concurrent load
 * - Build failures in CI/CD pipelines
 *
 * Usage:
 * ```typescript
 * const limiter = new ConcurrencyLimiter(2); // Max 2 concurrent operations
 * const result = await limiter.run(() => expensiveOperation());
 * ```
 */
export class ConcurrencyLimiter {
  private running = 0;
  private readonly queue: Array<() => Promise<unknown>> = [];

  /**
   * Create a new concurrency limiter.
   * @param maxConcurrent - Maximum number of concurrent operations allowed
   */
  constructor(private readonly maxConcurrent: number) {
    if (maxConcurrent < 1) {
      throw new Error("maxConcurrent must be at least 1");
    }
  }

  /**
   * Run a function with concurrency control.
   * If the maximum concurrent operations are already running, the function
   * will be queued and run once a slot becomes available.
   *
   * @param fn - Async function to run
   * @returns Promise that resolves to the function's result
   * @throws Error if the function throws
   *
   * @example
   * ```typescript
   * const limiter = new ConcurrencyLimiter(1); // Serial processing
   * const result = await limiter.run(() => generateOgImage(post));
   * ```
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    // Wait until a slot is available
    while (this.running >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.running++;

    try {
      return await fn();
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  /**
   * Process any queued operations.
   * This is called automatically when a slot becomes available.
   * @private
   */
  private processQueue(): void {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const fn = this.queue.shift();
      if (fn) {
        // Run the queued function, which will recursively process more queued items
        fn().catch(error => {
          // Log errors from queued operations

          console.error("[ConcurrencyLimiter] Queued operation failed:", error);
        });
      }
    }
  }

  /**
   * Get current statistics about the limiter state.
   * Useful for monitoring and debugging.
   *
   * @returns Object with running and queued operation counts
   */
  getStats() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

/**
 * Calculate optimal concurrency for OG image generation.
 *
 * Strategy:
 * - Use OG_IMAGE_CONCURRENCY env var if set (allows CI/CD tuning)
 * - Otherwise, use half of available CPU cores (balances parallelism vs memory)
 * - Minimum of 1, maximum of 8 (prevents excessive memory usage from Resvg)
 *
 * Each Resvg instance uses ~50-100MB of native memory, so we cap at 8
 * to prevent OOM on systems with many cores but limited RAM.
 *
 * @returns Optimal concurrency value
 */
function getOgImageConcurrency(): number {
  // Allow override via environment variable for CI/CD tuning
  const envConcurrency = process.env.OG_IMAGE_CONCURRENCY;
  if (envConcurrency) {
    const parsed = parseInt(envConcurrency, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      return Math.min(parsed, 16); // Hard cap at 16 for safety
    }
  }

  // Default: half of CPU cores, clamped between 1 and 8
  const cpuCount = cpus().length;
  const optimal = Math.max(1, Math.floor(cpuCount / 2));
  return Math.min(optimal, 8);
}

/**
 * Global instance for OG image generation concurrency control.
 *
 * Concurrency is determined by:
 * 1. OG_IMAGE_CONCURRENCY environment variable (if set)
 * 2. Half of available CPU cores (default)
 * 3. Clamped between 1 and 8 to balance speed vs memory usage
 *
 * This allows parallel OG image generation while preventing memory bloat
 * from too many concurrent Resvg instances.
 */
export const ogImageLimiter = new ConcurrencyLimiter(getOgImageConcurrency());
