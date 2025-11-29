import type { CollectionEntry } from "astro:content";
import postFilter from "./postFilter";

/**
 * Get all published blog posts sorted by date (newest first).
 *
 * This is the primary function for retrieving posts for display.
 * It filters out drafts and scheduled posts, then sorts by modification
 * date (if available) or publication date.
 *
 * @param posts - Array of all blog posts from the collection
 * @returns Filtered and sorted array of published posts
 *
 * @example
 * ```ts
 * import { getCollection } from "astro:content";
 * import getSortedPosts from "@/utils/post/getSortedPosts";
 *
 * const allPosts = await getCollection("blog");
 * const publishedPosts = getSortedPosts(allPosts);
 * // Returns: [newest post, ..., oldest post] (only published, non-draft)
 * ```
 *
 * @see postFilter for visibility logic (draft, scheduling)
 */
const getSortedPosts = (posts: CollectionEntry<"blog">[]) => {
  return posts
    .filter(postFilter)
    .sort(
      (a, b) =>
        Math.floor(
          new Date(b.data.modDatetime ?? b.data.pubDatetime).getTime() / 1000
        ) -
        Math.floor(
          new Date(a.data.modDatetime ?? a.data.pubDatetime).getTime() / 1000
        )
    );
};

export default getSortedPosts;
