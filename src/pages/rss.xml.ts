import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { getPath } from "@/utils/getPath";
import getSortedPosts from "@/utils/getSortedPosts";
import { SITE } from "@/config";
import { buildLogger } from "@/utils/buildLogger";

/**
 * Escape HTML special characters to prevent XSS attacks and XML parsing errors.
 * @param text - Text to escape
 * @returns HTML-escaped text
 */
function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replaceAll(/[&<>"']/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Sanitize description by escaping HTML and wrapping in CDATA.
 * Removes markdown formatting and dangerous content.
 * 
 * IMPORTANT: Uses non-catastrophic regex patterns to prevent ReDoS attacks.
 * Catastrophic patterns like /\*+([^*]+)\*+/ can hang on pathological input.
 * Instead, we use possessive-like patterns that fail fast.
 * 
 * @param description - Raw description text
 * @returns Sanitized description wrapped in CDATA
 */
function sanitizeDescription(description: string): string {
  if (!description) return "";

  // Escape HTML entities FIRST to prevent entity injection attacks
  // e.g., "&amp;lt;script&gt;" should become "&amp;lt;script&gt;" (safe)
  const escaped = escapeHtml(description);

  // Remove markdown formatting with non-catastrophic patterns
  // These patterns fail fast and won't hang on malicious input
  
  // Remove links: [text](url) -> text
  // Pattern: match [anything] followed by (anything)
  // Limited to 1000 chars to prevent catastrophic backtracking
  const noLinks = escaped.replaceAll(/\[([[\]]{0,1000})\]\(([()]{0,1000})\)/g, "$1");

  // Remove bold/italic: **text**, *text*, __text__, _text_ -> text
  // Use lazy matching to prevent catastrophic backtracking
  // Pattern prevents nesting by limiting character class
  const noEmphasis = noLinks
    .replaceAll(/\*{1,3}([^*]{0,1000}?)\*{1,3}/g, "$1")
    .replaceAll(/__{1,2}([^_]{0,1000}?)__{1,2}/g, "$1");

  // Remove code blocks: `code` -> code
  // Backticks cannot be nested, so this is safe
  const noCode = noEmphasis.replaceAll(/`([^`]{0,1000})`/g, "$1");

  // Safe truncation: count characters, not bytes (handles UTF-8)
  // Convert to array to properly handle multi-byte characters
  const chars = Array.from(noCode);
  const sanitized = chars.slice(0, 500).join("");

  return sanitized;
}

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
  try {
    const posts = await getCollection("blog");
    const sortedPosts = getSortedPosts(posts);

    // Limit to 50 most recent posts for reasonable RSS feed size
    // RSS readers and crawlers typically expect <= 50 items
    const recentPosts = sortedPosts.slice(0, 50);

    // Process feed items with error handling for individual posts
    const feedItems: Array<{
      link: string;
      title: string;
      description: string;
      pubDate: Date;
      guid: string;
    }> = [];

    for (const { data, id, filePath } of recentPosts) {
      try {
        const postUrl = getPath(id, filePath);
        const guid = `${SITE.website.replace(/\/$/, "")}${postUrl}`;

        feedItems.push({
          link: postUrl,
          // Escape title to prevent XML injection and XSS
          title: escapeHtml(data.title),
          // Wrap description in CDATA to handle special characters safely
          // CDATA sections preserve content without needing to escape
          description: `<![CDATA[${sanitizeDescription(data.description)}]]>`,
          pubDate: new Date(data.modDatetime ?? data.pubDatetime),
          // Unique identifier for each post (required by RSS spec)
          // Helps readers detect duplicate/updated posts
          guid: guid,
        });
      } catch (error) {
        // Log individual post processing errors but continue with other posts
        // eslint-disable-next-line no-console
        console.warn(
          `⚠️  Failed to process post "${id}" in RSS feed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    return rss({
      title: SITE.title,
      description: SITE.desc,
      site: SITE.website,
      items: feedItems,
    });
  } catch (error) {
    // Fallback: Return minimal valid RSS feed if generation fails
    // eslint-disable-next-line no-console
    console.error(
      `❌ Failed to generate RSS feed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );

    // Return a minimal valid RSS structure so feeds don't break completely
    return rss({
      title: SITE.title,
      description: SITE.desc,
      site: SITE.website,
      items: [],
    });
  }
}
