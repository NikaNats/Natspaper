import type { CollectionEntry } from "astro:content";
import { FEATURES } from "@/config";

/**
 * Determine if a blog post should be published.
 *
 * Logic:
 * 1. Drafts are never published.
 * 2. Compares the post's UTC timestamp vs Current UTC timestamp.
 * 3. Applies a margin to allow caching slightly before the exact second.
 */
const postFilter = ({ data }: CollectionEntry<"blog">) => {
  // 1. Drafts are never published
  if (data.draft) {
    return false;
  }

  // 2. In development, show all non-draft posts immediately
  if (import.meta.env.DEV) {
    return true;
  }

  // 3. Scheduling Logic (Production)
  // Astro/Zod parses frontmatter dates as UTC. We compare against Date.now() (also UTC).
  const publishTime = data.pubDatetime.getTime();
  const now = Date.now();

  // Allow posts to appear slightly before schedule (e.g., 15 mins)
  // to account for build times and cache warming.
  const marginMs = FEATURES.scheduledPostMargin;
  const effectivePublishTime = publishTime - marginMs;

  return now > effectivePublishTime;
};

export default postFilter;
