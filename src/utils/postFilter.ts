import type { CollectionEntry } from "astro:content";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { SITE } from "@/config";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Parse date string to UTC timestamp, accounting for the configured timezone.
 * Leverages dayjs timezone support for robust, battle-tested DST handling.
 *
 * @param dateString - ISO date string from frontmatter (interpreted as local time in timezone)
 * @param tz - IANA timezone string (e.g., "Asia/Bangkok", "America/New_York")
 * @returns UTC timestamp in milliseconds
 */
function getUtcTimestampForTimezone(dateString: string | Date, tz: string): number {
  try {
    const timestamp = dayjs(dateString).tz(tz).valueOf();
    return Number.isNaN(timestamp) ? Date.now() : timestamp;
  } catch {
    // Fallback: treat as UTC if timezone conversion fails
    return new Date(dateString).getTime();
  }
}

/**
 * Determine if a blog post should be published based on:
 * 1. Draft status
 * 2. Scheduled publication time (respecting configured timezone)
 * 3. Scheduled post margin (configurable pre-publication window)
 *
 * @param post - Blog post collection entry
 * @returns true if post should be published, false otherwise
 */
const postFilter = ({ data }: CollectionEntry<"blog">) => {
  // Drafts are never published in production
  if (data.draft) {
    return false;
  }

  // In development, show all non-draft posts immediately
  if (import.meta.env.DEV) {
    return true;
  }

  // In production, check if scheduled publication time has passed
  const publishUtcMs = getUtcTimestampForTimezone(
    data.pubDatetime,
    SITE.timezone
  );

  // Apply scheduled post margin: posts can appear slightly before their scheduled time
  // This allows building and caching before the exact publish moment
  const now = Date.now();
  const marginMs = SITE.scheduledPostMargin;
  const publishTimeWithMargin = publishUtcMs - marginMs;

  return now > publishTimeWithMargin;
};

export default postFilter;
