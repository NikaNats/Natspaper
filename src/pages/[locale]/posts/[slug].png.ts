import type { APIRoute } from "astro";
import type { CollectionEntry } from "astro:content";
import { PostRepository } from "@/utils/post/repository";
import { getLastPathSegment } from "@/utils/core/slugify";
import { generateOgImageForPost } from "@/utils/og";
import { ogImageLimiter } from "@/utils/core";
import { FEATURES } from "@/config";
import { SUPPORTED_LANGS } from "@/i18n/config";
import type { Lang } from "@/i18n";

/**
 * Generate static OG image routes for blog posts.
 * Optimizations:
 * - Filters only posts that need dynamic OG images (no custom image provided)
 * - Excludes draft posts from generation
 * - Uses adaptive concurrency (configurable via OG_IMAGE_CONCURRENCY env var)
 * - Each image generation includes explicit memory cleanup
 */
export async function getStaticPaths() {
  if (!FEATURES.dynamicOgImage) {
    return [];
  }

  const paths = [];

  // Generate paths for all supported locales
  for (const locale of SUPPORTED_LANGS) {
    const posts = (await PostRepository.getByLocale(locale as Lang)).filter(
      ({ data }) => !data.ogImage
    );

    for (const post of posts) {
      const slug = getLastPathSegment(String(post.id));
      paths.push({
        params: { locale, slug },
        props: post,
      });
    }
  }

  return paths;
}

/**
 * Serve dynamically generated OG image for a blog post.
 * Image is rendered from post metadata using Satori + Resvg.
 *
 * Concurrency control: OG image generation uses adaptive concurrency
 * (default: half of CPU cores, configurable via OG_IMAGE_CONCURRENCY env var)
 * to balance build speed with memory safety. This prevents:
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

  // Run OG generation with concurrency control (adaptive concurrency)
  const buffer = await ogImageLimiter.run(() =>
    generateOgImageForPost(props as CollectionEntry<"blog">)
  );

  return new Response(new Uint8Array(buffer), {
    headers: { "Content-Type": "image/png" },
  });
};
