/**
 * Markdown File Request Handler
 *
 * This route catches requests for markdown files (e.g., `/posts/post-name.md`)
 * and redirects them to the proper slug-based URL (e.g., `/posts/post-name`).
 *
 * This prevents 404 warnings from:
 * - Pagefind search indexing that might try to access markdown files
 * - External tools or crawlers that reference the original file names
 * - Search engines attempting to index raw markdown
 *
 * The redirect uses HTTP 301 (permanent redirect) to ensure proper SEO handling.
 */

import type { APIRoute } from "astro";
import { PostRepository } from "@/utils/post/repository";
import { getLastPathSegment } from "@/utils/core/slugify";

/**
 * Generate static paths for ALL posts to ensure the .md redirect works.
 * In output: 'static', we must explicitly define every path we want to catch.
 */
export async function getStaticPaths() {
  // 1. Get all English posts
  const posts = await PostRepository.getByLocale("en");

  // 2. Map them to the [...file] param
  return posts.map(post => {
    // Extract clean slug (e.g., "my-post")
    const slug = getLastPathSegment(post.slug);
    return {
      params: {
        // This creates the path /en/posts/my-post.md
        file: slug,
      },
    };
  });
}

export const GET: APIRoute = async ({ params }) => {
  // Construct the destination URL (remove .md)
  // Since we generated the path based on the slug, we know where it goes.
  const cleanSlug = params.file;

  return new Response(null, {
    status: 301,
    headers: {
      Location: `/en/posts/${cleanSlug}`,
    },
  });
};
