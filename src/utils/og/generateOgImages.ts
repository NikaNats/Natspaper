import { Resvg } from "@resvg/resvg-js";
import { type CollectionEntry } from "astro:content";
import postOgImage from "./templates/post";

/**
 * @resvg/resvg-js v2+ uses Node-API (N-API), which automatically releases the
 * underlying C++ memory via a Finalizer when the JS object becomes unreachable.
 *
 * Calling `resvg.free()` manually was only required by the old WASM build and
 * is now a no-op at best and a double-free crash at worst.
 *
 * Triggering `globalThis.gc()` is a "Stop-The-World" V8 operation that halts
 * the entire Event Loop.  With a ConcurrencyLimiter running 8 workers in
 * parallel, calling gc() after every image would serially block the build.
 *
 * Strategy: set local refs to `null` in the `finally` block so the N-API
 * Finalizer can collect the native handle as soon as the current task drains.
 */
function releaseResvgRefs(
  resvg: Resvg | null,
  pngData: ReturnType<Resvg["render"]> | null
): void {
  // Intentionally empty — the assignment to null at the call-site is what
  // matters.  This function exists only for documentation clarity.
  void resvg;
  void pngData;
}

/**
 * Convert SVG buffer to PNG with proper memory cleanup.
 * Resvg is a native C++ binding that requires explicit cleanup to prevent memory leaks.
 *
 * IMPORTANT: Memory management strategy:
 * 1. Create Resvg from SVG string
 * 2. Call render() to get PngData
 * 3. Extract PNG bytes from PngData BEFORE freeing Resvg
 * 4. Explicitly null references to allow GC before returning
 * 5. Handle all exceptions to ensure cleanup always runs
 *
 * @param svg - SVG string to convert
 * @returns PNG buffer
 * @throws Error if Resvg rendering fails
 */
function svgBufferToPngBuffer(svg: string): Uint8Array {
  let resvg: Resvg | null = null;
  let pngDataRef: ReturnType<Resvg["render"]> | null = null;

  try {
    resvg = new Resvg(svg, { logLevel: "error" });
    pngDataRef = resvg.render();

    // Extract PNG bytes while pngDataRef is still valid
    const buffer = pngDataRef.asPng();

    return new Uint8Array(buffer);
  } catch (error) {
    // Log rendering errors but continue with cleanup

    console.error(
      `[OG Image] Resvg rendering error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  } finally {
    // Null out local references so the N-API Finalizer can reclaim the
    // native Resvg/PngData handles as part of normal GC.
    // Do NOT call resvg.free() (removed — double-free risk in N-API builds).
    // Do NOT call globalThis.gc() (removed — Stop-The-World, blocks Event Loop).
    releaseResvgRefs(resvg, pngDataRef);
    resvg = null;
    pngDataRef = null;
  }
}

/**
 * Create a minimal fallback OG image (1x1 transparent PNG).
 * Used when font loading fails to prevent entire build cascade failure.
 * @returns Minimal PNG buffer
 */
function createFallbackPngBuffer(): Uint8Array {
  // 1x1 transparent PNG as fallback
  return new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0d, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
    0x00, 0x00, 0x05, 0xfe, 0x02, 0xfe, 0x60, 0x4e, 0xe5, 0x81, 0x00, 0x00,
    0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
}

/**
 * Generate OG image for a blog post.
 * Processes sequentially to avoid memory accumulation from concurrent Resvg instances.
 * Returns fallback image if font loading fails to prevent build cascade failure.
 *
 * @param post - Blog post to generate OG image for
 * @returns PNG buffer (or fallback if generation fails)
 */
export async function generateOgImageForPost(
  post: CollectionEntry<"blog">
): Promise<Uint8Array> {
  try {
    const svg = await postOgImage(post);
    return svgBufferToPngBuffer(svg);
  } catch (error) {
    // Log the full error for debugging in verbose mode
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";

    console.warn(
      `[OG Image] Failed to generate OG for post "${post.id}":`,
      errorMessage
    );
    if (errorStack) {
      console.warn(`[OG Image] Stack trace:`, errorStack);
    }

    // Log that we're falling back to prevent confusion about missing images

    console.warn(
      `[OG Image] Using 1x1 fallback image for "${post.id}". ` +
        `This post will need a custom OG image or proper fonts to render correctly.`
    );

    // Return fallback instead of throwing - prevents entire build failure
    return createFallbackPngBuffer();
  }
}
