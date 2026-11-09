import type { CollectionEntry } from "astro:content";
import postFilter from "./postFilter";

/**
 * Canonical post ordering: newest `pubDatetime` first, ties broken by `id`.
 *
 * This is the single comparator used by every listing (home, posts, archives,
 * tags, RSS/Atom, sitemap) so ordering can never drift between routes.
 *
 * - `pubDatetime` (not `modDatetime`) is the sort key: editing an old post
 *   must not move it to the top of a reverse-chronological feed.
 * - The `id` tie-break makes builds deterministic (stable HTML, stable CSP
 *   hashes, no spurious diffs) when two posts share a timestamp.
 */
export const comparePostsByPubDate = (
  a: CollectionEntry<"blog">,
  b: CollectionEntry<"blog">
): number =>
  b.data.pubDatetime.getTime() - a.data.pubDatetime.getTime() ||
  a.id.localeCompare(b.id);

/**
 * Get all published blog posts sorted by publication date (newest first).
 *
 * Filters out drafts and scheduled (future-dated) posts via `postFilter`,
 * then orders with {@link comparePostsByPubDate}.
 *
 * @param posts - Array of blog posts
 * @returns New, filtered and sorted array (input is not mutated)
 *
 * @see postFilter for visibility logic (draft, scheduling)
 */
const getSortedPosts = (posts: CollectionEntry<"blog">[]) =>
  posts.filter(postFilter).sort(comparePostsByPubDate);

export default getSortedPosts;
