/**
 * Markdown File Request Handler
 *
 * This route catches requests for markdown files (e.g., `/posts/post-name.md`)
 * and redirects them to the proper slug-based URL (e.g., `/posts/post-name`).
 *
 * This prevents 404 warnings from:
 * - External tools or crawlers that reference the original file names
 * - Search engines attempting to index raw markdown
 *
 * The redirect uses HTTP 301 (permanent redirect) to ensure proper SEO handling.
 */

import type { APIRoute } from "astro";
import { PostRepository } from "@/utils/post/repository";
import { getPostSlug } from "@/utils/post/postUrl";
import { SUPPORTED_LANGS } from "@/i18n/config";
import type { Lang } from "@/i18n";

/**
 * Generate static paths for ALL posts to ensure the .md redirect works.
 * In output: 'static', we must explicitly define every path we want to catch.
 */
export async function getStaticPaths() {
  // Load every supported locale concurrently
  const postsByLocale = await Promise.all(
    SUPPORTED_LANGS.map(async locale => ({
      locale,
      posts: await PostRepository.getByLocale(locale as Lang),
    }))
  );

  return postsByLocale.flatMap(({ locale, posts }) =>
    posts.map(post => ({
      params: {
        locale,
        // Clean slug (e.g., "my-post") -> /{locale}/posts/my-post.md
        file: getPostSlug(post.slug),
      },
    }))
  );
}

export const GET: APIRoute = ({ params }) => {
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
