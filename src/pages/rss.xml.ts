import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { getPath } from "@/utils/getPath";
import getSortedPosts from "@/utils/getSortedPosts";
import { SITE } from "@/config";

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
 * @param description - Raw description text
 * @returns Sanitized description wrapped in CDATA
 */
function sanitizeDescription(description: string): string {
  if (!description) return "";

  // Escape HTML entities
  const escaped = escapeHtml(description);

  // Remove markdown formatting (basic cleanup)
  // Remove links: [text](url) -> text
  const noLinks = escaped.replaceAll(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove bold/italic: **text** or *text* -> text
  const noEmphasis = noLinks.replaceAll(/\*+([^*]+)\*+/g, "$1");

  // Remove code blocks
  const noCode = noEmphasis.replaceAll(/`([^`]+)`/g, "$1");

  return noCode.substring(0, 500); // Limit to 500 chars
}

/**
 * Generate RSS feed with pagination, XSS protection, and proper XML formatting.
 * Limits to 50 most recent posts to maintain reasonable feed size.
 */
export async function GET() {
  const posts = await getCollection("blog");
  const sortedPosts = getSortedPosts(posts);

  // Limit to 50 most recent posts for reasonable RSS feed size
  // RSS readers and crawlers typically expect <= 50 items
  const recentPosts = sortedPosts.slice(0, 50);

  return rss({
    title: SITE.title,
    description: SITE.desc,
    site: SITE.website,
    items: recentPosts.map(({ data, id, filePath }) => {
      const postUrl = getPath(id, filePath);
      const guid = `${SITE.website.replace(/\/$/, "")}${postUrl}`;

      return {
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
      };
    }),
  });
}
