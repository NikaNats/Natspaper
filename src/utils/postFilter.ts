import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config";

/**
 * Parse date string to UTC timestamp, accounting for the configured timezone.
 * Uses Intl API for robust timezone handling without complex DST calculations.
 *
 * @param dateString - ISO date string from frontmatter (interpreted as local time in timezone)
 * @param timezone - IANA timezone string (e.g., "Asia/Bangkok", "America/New_York")
 * @returns UTC timestamp in milliseconds
 */
function getUtcTimestampForTimezone(
  dateString: string | Date,
  timezone: string
): number {
  try {
    // Parse the date string as-is (treating it as wall clock time in the target timezone)
    const date = new Date(dateString);

    // If parsing failed, return the time as-is
    if (Number.isNaN(date.getTime())) {
      return Date.now();
    }

    // Use binary search to find the UTC timestamp that, when formatted in the target timezone,
    // matches the input date string's wall clock time
    const initialUtcMs = date.getTime();

    // Format options for consistent comparison
    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };

    const formatter = new Intl.DateTimeFormat("en-US", formatOptions);

    // Helper function to get formatted parts from a UTC timestamp
    const getFormattedTime = (ms: number) => {
      const parts = formatter.formatToParts(new Date(ms));
      const values: Record<string, string> = {};
      for (const part of parts) {
        values[part.type] = part.value;
      }
      return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
    };

    // Parse target time string
    let targetString: string;
    if (dateString instanceof Date) {
      targetString = getFormattedTime(dateString.getTime());
    } else {
      // Normalize ISO string to YYYY-MM-DDTHH:mm:ss format
      const isoRegex = /(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/;
      const match = isoRegex.exec(String(dateString));
      if (match) {
        targetString = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}`;
      } else {
        return date.getTime();
      }
    }

    // Binary search: find UTC time that maps to target wall clock time
    // Range: ±24 hours from initial guess to handle DST transitions
    let lowMs = initialUtcMs - 24 * 60 * 60 * 1000;
    let highMs = initialUtcMs + 24 * 60 * 60 * 1000;

    for (let i = 0; i < 25; i++) {
      const midMs = Math.floor((lowMs + highMs) / 2);
      const midFormatted = getFormattedTime(midMs);

      if (midFormatted === targetString) {
        return midMs;
      }

      // Compare as timestamps for binary search
      const comparison = midFormatted.localeCompare(targetString);
      if (comparison < 0) {
        lowMs = midMs;
      } else {
        highMs = midMs;
      }

      // Stop early if converged
      if (highMs - lowMs < 1000) {
        return Math.floor((lowMs + highMs) / 2);
      }
    }

    // Fallback: return the closest result after binary search
    return Math.floor((lowMs + highMs) / 2);
  } catch {
    // Final fallback: treat as UTC if timezone conversion fails
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
