import type { APIRoute } from "astro";
import { type CollectionEntry } from "astro:content";
import { PostRepository } from "@/utils/post/repository";
import { getLastPathSegment } from "@/utils/core/slugify";
import { generateOgImageForPost } from "@/utils/og";
import { ogImageLimiter } from "@/utils/core";
import { FEATURES } from "@/config";

/**
 * Generate static OG image routes for blog posts.
 * Optimizations:
 * - Filters only posts that need dynamic OG images (no custom image provided)
 * - Excludes draft posts from generation
 * - Processes images sequentially to prevent memory bloat from concurrent Resvg instances
 * - Each image generation includes explicit memory cleanup
 */
export async function getStaticPaths() {
  if (!FEATURES.dynamicOgImage) {
    return [];
  }

  const posts = (await PostRepository.getByLocale("en")).filter(
    ({ data }) => !data.ogImage
  );

  return posts.map(post => {
    const slug = getLastPathSegment(String(post.id));
    return {
      params: { slug },
      props: post,
    };
  });
}

/**
 * Serve dynamically generated OG image for a blog post.
 * Image is rendered from post metadata using Satori + Resvg.
 *
 * Concurrency control: OG image generation is serialized (max 1 concurrent)
 * to prevent memory bloat from concurrent Resvg instances. This prevents:
 * - Out-of-memory errors during builds with many posts
 * - Poor performance under concurrent load
 * - Build failures in CI/CD pipelines
 */
export const GET: APIRoute = async ({ props }) => {
  if (!FEATURES.dynamicOgImage) {
    return new Response(null, {
      status: 404,
      statusText: "Not found",
    });
  }

  // Run OG generation with concurrency control (serial processing)
  const buffer = await ogImageLimiter.run(() =>
    generateOgImageForPost(props as CollectionEntry<"blog">)
  );

  return new Response(new Uint8Array(buffer), {
    headers: { "Content-Type": "image/png" },
  });
};
