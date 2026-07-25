import { cpus } from "node:os";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Absolute upper bound regardless of env override — prevents OOM from Resvg. */
const HARD_CAP = 16;

/** Default ceiling when deriving from CPU count. */
const DEFAULT_MAX_CONCURRENCY = 8;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Internal representation of a task waiting in the FIFO queue.
 * `resolve` is called when a concurrency slot becomes available.
 */
interface QueuedTask {
  /** Wakes the awaiting `run()` call so it can proceed. */
  readonly resolve: () => void;
  /** Rejects the awaiting `run()` call (e.g. on abort). */
  readonly reject: (reason: unknown) => void;
  /** Optional cancellation signal supplied by the caller. */
  readonly signal?: AbortSignal;
}

/**
 * Immutable snapshot of limiter state for monitoring / logging.
 */
export interface ConcurrencyLimiterStats {
  readonly running: number;
  readonly queued: number;
  readonly maxConcurrent: number;
  readonly completed: number;
  readonly failed: number;
}

/**
 * Per-invocation options for {@link ConcurrencyLimiter.run}.
 */
export interface RunOptions {
  /**
   * Abort signal — if triggered while the task is **queued** (not yet
   * executing), the task is removed from the queue and the returned
   * promise rejects with an `AbortError`.
   *
   * If triggered **during execution**, the underlying `fn` is responsible
   * for honouring the signal; the limiter does not forcibly kill it.
   */
  readonly signal?: AbortSignal;

  /**
   * Maximum wall-clock milliseconds the operation may take.
   * Exceeding this rejects with a `TimeoutError`.
   *
   * @remarks The underlying promise is **not** cancelled — only the
   *          wrapper rejects. Pair with `signal` for true cancellation.
   */
  readonly timeoutMs?: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/** Thrown when an operation exceeds its `timeoutMs` budget. */
export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

/** Thrown when an operation is aborted via `AbortSignal`. */
export class AbortError extends Error {
  constructor(message = "Operation aborted") {
    super(message);
    this.name = "AbortError";
  }
}

// ============================================================================
// CONCURRENCY LIMITER
// ============================================================================

/**
 * Concurrency Limiter — controls the maximum number of concurrent async
 * operations using an **event-driven FIFO queue** (zero busy-wait).
 *
 * ## Why this exists
 *
 * During `astro build`, every OG-image route (`[slug].png.ts`) calls
 * Satori → Resvg. Each Resvg instance allocates ~50–100 MB of **native**
 * (off-heap) memory. Uncontrolled `Promise.all` over dozens of posts
 * causes OOM in CI/CD. This limiter serialises access to a bounded pool
 * of concurrent slots.
 *
 * ## Design decisions
 *
 * | Concern | Approach |
 * |---|---|
 * | Scheduling | Promise-based FIFO queue — **no `setTimeout` polling** |
 * | Slot hand-off | `releaseSlot()` transfers the slot directly to the next queued task (running count stays constant) |
 * | Cancellation | `AbortSignal` removes the task from the queue before execution |
 * | Timeout | Optional per-call `timeoutMs` wrapper |
 * | Idle detection | `onIdle()` resolves when running + queued === 0 |
 * | Observability | `getStats()` returns live counters |
 *
 * @example
 * ```ts
 * const limiter = new ConcurrencyLimiter(2);
 *
 * // Basic usage
 * const png = await limiter.run(() => generateOgImage(post));
 *
 * // With cancellation
 * const controller = new AbortController();
 * const png = await limiter.run(() => generateOgImage(post), {
 *   signal: controller.signal,
 *   timeoutMs: 30_000,
 * });
 *
 * // Wait for all work to finish (useful at build end)
 * await limiter.onIdle();
 * ```
 */
export class ConcurrencyLimiter {
  // ── Mutable state ──────────────────────────────────────────────────────
  private running = 0;
  private completed = 0;
  private failed = 0;

  /** FIFO queue of tasks waiting for a slot. */
  private readonly queue: QueuedTask[] = [];

  /** Resolvers notified when the limiter becomes fully idle. */
  private idleResolvers: Array<() => void> = [];

  // ── Constructor ────────────────────────────────────────────────────────

  /**
   * @param maxConcurrent - Maximum number of operations that may execute
   *   simultaneously. Must be a **positive integer**.
   * @throws {RangeError} If `maxConcurrent` is not a positive integer.
   */
  constructor(private readonly maxConcurrent: number) {
    if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1) {
      throw new RangeError(
        `[ConcurrencyLimiter] maxConcurrent must be a positive integer, ` +
          `received: ${String(maxConcurrent)}`
      );
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Execute `fn` with concurrency control.
   *
   * If all slots are occupied the call **suspends** (via a queued Promise)
   * until a slot is freed — there is **no polling / busy-wait**.
   *
   * @typeParam T - Return type of the wrapped function.
   * @param fn - Async factory to execute. Called **exactly once**.
   * @param options - Optional cancellation / timeout settings.
   * @returns The resolved value of `fn`.
   * @throws {AbortError} If `options.signal` fires while the task is queued.
   * @throws {TimeoutError} If execution exceeds `options.timeoutMs`.
   * @throws Re-throws any error from `fn`.
   */
  async run<T>(fn: () => Promise<T>, options?: RunOptions): Promise<T> {
    // 1. Fast-path: already aborted before we even start.
    if (options?.signal?.aborted) {
      throw new AbortError();
    }

    // 2. Acquire a concurrency slot (immediate or queued).
    await this.acquireSlot(options?.signal);

    // 3. Slot acquired — execute.
    try {
      const result = options?.timeoutMs
        ? await this.withTimeout(fn(), options.timeoutMs)
        : await fn();

      this.completed++;
      return result;
    } catch (error) {
      this.failed++;
      throw error;
    } finally {
      // 4. Always release — either hand off to next task or free the slot.
      this.releaseSlot();
    }
  }

  /**
   * Returns a promise that resolves when **all** running and queued
   * operations have settled. Useful as a build-completion gate.
   *
   * Resolves **immediately** if the limiter is already idle.
   */
  onIdle(): Promise<void> {
    if (this.running === 0 && this.queue.length === 0) {
      return Promise.resolve();
    }
    return new Promise<void>(resolve => {
      this.idleResolvers.push(resolve);
    });
  }

  /**
   * Immutable snapshot of the limiter's current state.
   *
   * @example
   * ```ts
   * const { running, queued } = limiter.getStats();
   * console.log(`OG images: ${running} active, ${queued} queued`);
   * ```
   */
  getStats(): ConcurrencyLimiterStats {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      completed: this.completed,
      failed: this.failed,
    } as const;
  }

  // ── Private: slot management ───────────────────────────────────────────

  /**
   * Acquire a concurrency slot.
   *
   * - If a slot is free → increment `running` and resolve immediately.
   * - Otherwise → enqueue a `QueuedTask` and suspend until `releaseSlot()`
   *   hands off a slot.
   *
   * If `signal` fires while the task is **still in the queue**, the task
   * is spliced out and the promise rejects with `AbortError`.
   */
  private acquireSlot(signal?: AbortSignal): Promise<void> {
    // Fast path — slot available right now.
    if (this.running < this.maxConcurrent) {
      this.running++;
      return Promise.resolve();
    }

    // Slow path — wait in the FIFO queue.
    return new Promise<void>((resolve, reject) => {
      const task: QueuedTask = { resolve, reject, signal };

      // Wire up cancellation while queued.
      if (signal) {
        const onAbort = (): void => {
          const idx = this.queue.indexOf(task);
          if (idx !== -1) {
            this.queue.splice(idx, 1);
          }
          reject(new AbortError());
        };
        signal.addEventListener("abort", onAbort, { once: true });
      }

      this.queue.push(task);
    });
  }

  /**
   * Release the current slot.
   *
   * **Slot-handoff pattern**: instead of decrementing `running` and then
   * incrementing it again for the next task (which would create a brief
   * window where `running < maxConcurrent` and a *new* caller could
   * sneak in), we **transfer** the slot directly to the next queued task.
   * The `running` counter stays constant during the handoff.
   *
   * Aborted tasks in the queue are silently skipped.
   */
  private releaseSlot(): void {
    // Walk the queue until we find a non-aborted task to hand the slot to.
    while (this.queue.length > 0) {
      const next = this.queue.shift();
      if (!next) break;

      // Skip tasks whose signal fired while they were queued.
      if (next.signal?.aborted) {
        continue;
      }

      // Hand off the slot — `running` stays the same.
      next.resolve();
      return;
    }

    // No queued tasks — actually free the slot.
    this.running--;

    // Notify idle waiters if we've fully drained.
    if (this.running === 0 && this.queue.length === 0) {
      this.notifyIdle();
    }
  }

  /** Flush all pending `onIdle()` resolvers. */
  private notifyIdle(): void {
    const resolvers = this.idleResolvers;
    this.idleResolvers = [];
    for (const resolve of resolvers) {
      resolve();
    }
  }

  // ── Private: timeout wrapper ───────────────────────────────────────────

  /**
   * Race `promise` against a `setTimeout` deadline.
   *
   * @remarks The timer is `unref()`'d so it does **not** keep the Node.js
   *   event loop alive if the process is otherwise ready to exit.
   */
  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new TimeoutError(ms));
      }, ms);

      // Prevent the timer from holding the process open.
      if (typeof timer === "object" && "unref" in timer) {
        timer.unref();
      }

      promise
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}

// ============================================================================
// OG IMAGE CONCURRENCY HEURISTIC
// ============================================================================

/**
 * Determine the optimal concurrency for OG image generation.
 *
 * Resolution order:
 * 1. `OG_IMAGE_CONCURRENCY` env var (CI/CD override) — clamped to [1, 16].
 * 2. `floor(cpus / 2)` — balances parallelism vs. native-memory pressure.
 * 3. Hard ceiling of **8** for the CPU-derived path (each Resvg instance
 *    uses ~50–100 MB of off-heap memory).
 *
 * @returns A positive integer suitable for `new ConcurrencyLimiter(n)`.
 */
function getOgImageConcurrency(): number {
  // 1. Environment override (allows per-pipeline tuning).
  const envRaw = process.env.OG_IMAGE_CONCURRENCY;

  if (envRaw !== undefined && envRaw.trim() !== "") {
    const parsed = Number.parseInt(envRaw, 10);

    if (Number.isInteger(parsed) && parsed >= 1) {
      return Math.min(parsed, HARD_CAP);
    }

    // Malformed value — warn and fall through to the CPU heuristic.
    console.warn(
      `[ConcurrencyLimiter] Ignoring invalid OG_IMAGE_CONCURRENCY="${envRaw}". ` +
        `Expected a positive integer ≤ ${HARD_CAP}.`
    );
  }

  // 2. CPU-derived default.
  const cpuCount = cpus().length;
  const derived = Math.max(1, Math.floor(cpuCount / 2));

  return Math.min(derived, DEFAULT_MAX_CONCURRENCY);
}

// ============================================================================
// GLOBAL SINGLETON
// ============================================================================

/**
 * Shared limiter for all OG image generation during `astro build`.
 *
 * Concurrency is resolved once at module load:
 * - `OG_IMAGE_CONCURRENCY` env var → clamped to [1, 16]
 * - Otherwise → `min(floor(cpus / 2), 8)`
 *
 * @example
 * ```ts
 * // In [slug].png.ts
 * import { ogImageLimiter } from "@/utils/core";
 *
 * export const GET: APIRoute = async ({ props }) => {
 *   const buffer = await ogImageLimiter.run(() =>
 *     generateOgImageForPost(props as CollectionEntry<"blog">),
 *   );
 *   return new Response(new Uint8Array(buffer), {
 *     headers: { "Content-Type": "image/png" },
 *   });
 * };
 * ```
 */
export const ogImageLimiter = new ConcurrencyLimiter(getOgImageConcurrency());
