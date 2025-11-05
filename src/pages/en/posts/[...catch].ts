/**
 * Catch-All Route for Post Requests
 *
 * This route catches all requests to `/posts/*` and handles special cases:
 * 1. Markdown file requests (e.g., `/posts/post-name.md`) → redirect to `/posts/post-name`
 * 2. Other requests → return 404
 *
 * This prevents 404 warnings from:
 * - Pagefind search indexing that might try to access markdown files
 * - External tools or crawlers that reference the original file names
 * - Search engines attempting to index raw markdown
 */

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Check if the request ends with .md (markdown file)
  if (pathname.endsWith(".md")) {
    // Remove .md extension to get the clean slug
    const cleanPath = pathname.replace(/\.md$/, "");

    // Return a permanent redirect to the proper slug-based URL
    return new Response(null, {
      status: 301,
      headers: {
        Location: cleanPath,
      },
    });
  }

  // For non-markdown requests, return 404
  return new Response("Not Found", { status: 404 });
};

export async function getStaticPaths() {
  // Return empty array - this will be handled dynamically
  return [];
}
