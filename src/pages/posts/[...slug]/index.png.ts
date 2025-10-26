import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { getPath } from "@/utils/getPath";
import { generateOgImageForPost } from "@/utils/generateOgImages";
import { ogImageLimiter } from "@/utils/concurrencyLimiter";
import { SITE } from "@/config";

/**
 * Generate static OG image routes for blog posts.
 * Optimizations:
 * - Filters only posts that need dynamic OG images (no custom image provided)
 * - Excludes draft posts from generation
 * - Processes images sequentially to prevent memory bloat from concurrent Resvg instances
 * - Each image generation includes explicit memory cleanup
 */
export async function getStaticPaths() {
  if (!SITE.dynamicOgImage) {
    return [];
  }

  const posts = await getCollection("blog").then(p =>
    p.filter(({ data }) => !data.draft && !data.ogImage)
  );

  return posts.map(post => ({
    params: { slug: getPath(post.id, post.filePath, false) },
    props: post,
  }));
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
  if (!SITE.dynamicOgImage) {
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
