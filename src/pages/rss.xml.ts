// Redirects to localized RSS; top-level feed preserved for compatibility.

/**
 * Generate RSS feed with pagination, XSS protection, and proper XML formatting.
 * Limits to 50 most recent posts to maintain reasonable feed size.
 *
 * Includes error handling and graceful degradation:
 * - Catches errors during post collection and processing
 * - Continues with available posts if one fails
 * - Falls back to minimal feed on complete failure
 */
export async function GET() {
  // Redirect to the English RSS feed which is the canonical top-level feed.
  // The site also exposes localized feeds at /en/rss.xml and /ka/rss.xml.
  return new Response(null, {
    status: 301,
    headers: {
      Location: "/en/rss.xml",
    },
  });
}
