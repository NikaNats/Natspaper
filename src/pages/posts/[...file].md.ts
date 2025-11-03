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

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Check if the request ends with .md
  if (pathname.endsWith(".md")) {
    // Remove .md extension to get the slug
    const slug = pathname.replace(/\.md$/, "");

    // Return a permanent redirect to the proper slug-based URL
    return new Response(null, {
      status: 301,
      headers: {
        Location: slug,
      },
    });
  }

  return new Response("Not Found", { status: 404 });
};

export async function getStaticPaths() {
  // Return empty array since this is a dynamic catch-all
  // It will handle requests at runtime in dev mode
  return [];
}
