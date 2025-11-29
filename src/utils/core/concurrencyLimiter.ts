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
 * Global instance for OG image generation concurrency control.
 * Processes OG images serially (maxConcurrent=1) to prevent memory bloat.
 * This ensures that only one Resvg instance is active at a time.
 */
export const ogImageLimiter = new ConcurrencyLimiter(1);
