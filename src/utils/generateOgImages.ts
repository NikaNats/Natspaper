import { Resvg } from "@resvg/resvg-js";
import { type CollectionEntry } from "astro:content";
import postOgImage from "./og-templates/post";
import siteOgImage from "./og-templates/site";

/**
 * Convert SVG buffer to PNG with proper memory cleanup.
 * Resvg is a native C++ binding that requires explicit cleanup to prevent memory leaks.
 * @param svg - SVG string to convert
 * @returns PNG buffer
 */
function svgBufferToPngBuffer(svg: string): Uint8Array {
  let resvg: Resvg | null = null;
  try {
    resvg = new Resvg(svg);
    const pngData = resvg.render();
    return pngData.asPng();
  } finally {
    // Explicitly release native C++ memory if available
    // @ts-expect-error Resvg may have free method depending on version
    if (resvg?.free && typeof resvg.free === "function") {
      // @ts-expect-error Resvg may have free method depending on version
      resvg.free();
    }
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
    // eslint-disable-next-line no-console
    console.warn(
      `[OG Image] Failed to generate OG for post "${post.id}", using fallback: ${error instanceof Error ? error.message : String(error)}`
    );
    // Return fallback instead of throwing - prevents entire build failure
    return createFallbackPngBuffer();
  }
}

/**
 * Generate OG image for the site.
 * @returns PNG buffer
 */
export async function generateOgImageForSite(): Promise<Uint8Array> {
  const svg = await siteOgImage();
  return svgBufferToPngBuffer(svg);
}
