import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { getSortedPosts } from "@/utils/post";
import { SITE } from "@/config";
import {
  sanitizeMarkdownUrls,
  escapeHtml,
  sanitizeDescription,
} from "@/utils/rss";

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
    const allPosts = await getCollection("blog");
    // By default, the RSS feed at /rss.xml contains English posts
    // Translated pages can create their own language-specific feeds if needed
    const posts = allPosts.filter(post => post.slug.startsWith("en/"));
    const sortedPosts = getSortedPosts(posts);

    // Limit to 50 most recent posts for reasonable RSS feed size
    // RSS readers and crawlers typically expect <= 50 items
    const recentPosts = sortedPosts.slice(0, 50);

    // Process feed items with robust error handling for individual posts
    const feedItems: Array<{
      link: string;
      title: string;
      description: string;
      pubDate: Date;
      guid: string;
    }> = [];

    // Track failed posts for production alerting
    const failedPosts: Array<{ id: string; error: string }> = [];

    for (const { data, id } of recentPosts) {
      try {
        const slug = String(id).split("/").slice(-1)[0];
        const postUrl = `/en/posts/${slug}`;
        const guid = `${SITE.website.replace(/\/$/, "")}${postUrl}`;

        feedItems.push({
          link: postUrl,
          // Escape title to prevent XML injection and XSS
          title: escapeHtml(data.title),
          // Wrap description in CDATA to handle special characters safely
          // Apply defense-in-depth: remove HTML tags, escape entities, sanitize URLs, remove markdown
          description: `<![CDATA[${sanitizeMarkdownUrls(sanitizeDescription(data.description))}]]>`,
          pubDate: new Date(data.modDatetime ?? data.pubDatetime),
          // Unique identifier for each post (required by RSS spec)
          // Helps readers detect duplicate/updated posts
          guid: guid,
        });
      } catch (error) {
        // Track failed post for reporting
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        failedPosts.push({ id, error: errorMessage });

        // Always log failed posts to console for visibility
        // eslint-disable-next-line no-console
        console.warn(
          `⚠️  Failed to process post "${id}" in RSS feed: ${errorMessage}`
        );
      }
    }

    // In production, report failed posts to ensure developers are aware
    // RSS feed quality issues should not be silent
    if (failedPosts.length > 0 && import.meta.env.PROD) {
      // eslint-disable-next-line no-console
      console.error(
        `❌ RSS Feed Generation: ${failedPosts.length} post(s) failed processing`,
        failedPosts
      );
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
