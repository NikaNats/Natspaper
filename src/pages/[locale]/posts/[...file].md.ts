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
import { SUPPORTED_LANGS } from "@/i18n/config";
import type { Lang } from "@/i18n";

/**
 * Generate static paths for ALL posts to ensure the .md redirect works.
 * In output: 'static', we must explicitly define every path we want to catch.
 */
export async function getStaticPaths() {
  const paths = [];

  // Generate paths for all supported locales
  for (const locale of SUPPORTED_LANGS) {
    const posts = await PostRepository.getByLocale(locale as Lang);

    // Map them to the [...file] param
    for (const post of posts) {
      // Extract clean slug (e.g., "my-post")
      const slug = getLastPathSegment(post.slug);
      paths.push({
        params: {
          locale,
          // This creates the path /{locale}/posts/my-post.md
          file: slug,
        },
      });
    }
  }

  return paths;
}

export const GET: APIRoute = async ({ params }) => {
  // Construct the destination URL (remove .md)
  const locale = params.locale;
  const cleanSlug = params.file;

  return new Response(null, {
    status: 301,
    headers: {
      Location: `/${locale}/posts/${cleanSlug}`,
    },
  });
};
