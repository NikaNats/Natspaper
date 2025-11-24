/**
 * Catch-All Route for Post Requests
 *
 * This route catches all requests to `/ka/posts/*` and handles special cases:
 * 1. Markdown file requests (e.g., `/ka/posts/post-name.md`) → redirect to `/ka/posts/post-name`
 * 2. Other requests → return 404
 *
 * This prevents 404 warnings from:
 * - Pagefind search indexing that might try to access markdown files
 * - External tools or crawlers that reference the original file names
 * - Search engines attempting to index raw markdown
 */

import type { APIRoute } from "astro";
import { PostRepository } from "@/utils/post/repository";
import { getLastPathSegment } from "@/utils/core/slugify";

export async function getStaticPaths() {
  const posts = await PostRepository.getByLocale("ka");

  // Generate paths for both specific .md catch-alls AND generic catch-alls if needed
  const paths = posts.map(post => {
    const slug = getLastPathSegment(post.slug);
    return {
      params: {
        // Matches /ka/posts/my-post.md
        catch: `${slug}.md`,
      },
    };
  });

  return paths;
}

export const GET: APIRoute = async ({ params }) => {
  // Extract the slug from "my-post.md"
  const catchPath = params.catch || "";
  const cleanSlug = catchPath.replace(/\.md$/, "");

  return new Response(null, {
    status: 301,
    headers: {
      Location: `/ka/posts/${cleanSlug}`,
    },
  });
};
