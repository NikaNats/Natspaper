import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config";

/**
 * Parse date string to UTC timestamp, accounting for the configured timezone.
 * Handles DST (Daylight Saving Time) transitions correctly.
 *
 * The key insight: We need to find the UTC time such that when formatted in the
 * given timezone, it produces the date/time values from the date string.
 *
 * For DST edge cases (spring forward, fall back), this checks adjacent hours
 * to find the correct UTC mapping.
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
    // Convert to string if Date object
    const dateStr =
      dateString instanceof Date
        ? dateString.toISOString().split("T")[0] +
          "T" +
          dateString.toISOString().split("T")[1]?.split(".")[0]
        : String(dateString);

    // Parse ISO format: YYYY-MM-DDTHH:mm:ss
    const dateRegex = /(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/;
    const match = dateRegex.exec(dateStr);
    if (!match) {
      // Fallback for unparseable dates
      return new Date(dateString).getTime();
    }

    const targetYear = Number.parseInt(match[1], 10);
    const targetMonth = Number.parseInt(match[2], 10) - 1; // 0-indexed
    const targetDay = Number.parseInt(match[3], 10);
    const targetHour = Number.parseInt(match[4], 10);
    const targetMinute = Number.parseInt(match[5], 10);
    const targetSecond = Number.parseInt(match[6], 10);

    // Start with a guess: treat the date string as UTC and adjust
    let utcMs = new Date(
      targetYear,
      targetMonth,
      targetDay,
      targetHour,
      targetMinute,
      targetSecond
    ).getTime();

    // Formatter to check what time our UTC timestamp represents in the target timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const getFormattedParts = (ms: number) => {
      const parts = formatter.formatToParts(new Date(ms));
      return {
        year: Number.parseInt(
          parts.find(p => p.type === "year")?.value || "0",
          10
        ),
        month: Number.parseInt(
          parts.find(p => p.type === "month")?.value || "0",
          10
        ),
        day: Number.parseInt(
          parts.find(p => p.type === "day")?.value || "0",
          10
        ),
        hour: Number.parseInt(
          parts.find(p => p.type === "hour")?.value || "0",
          10
        ),
        minute: Number.parseInt(
          parts.find(p => p.type === "minute")?.value || "0",
          10
        ),
        second: Number.parseInt(
          parts.find(p => p.type === "second")?.value || "0",
          10
        ),
      };
    };

    let formatted = getFormattedParts(utcMs);

    // Adjust if we're off. Usually one attempt is enough.
    // For DST edge cases (like spring forward 2:00 AM → 3:00 AM),
    // we might need to try adjacent hours
    let attempts = 0;
    const maxAttempts = 25; // Check ±12 hours on each side for safety

    while (
      (formatted.year !== targetYear ||
        formatted.month !== targetMonth + 1 ||
        formatted.day !== targetDay ||
        formatted.hour !== targetHour ||
        formatted.minute !== targetMinute ||
        formatted.second !== targetSecond) &&
      attempts < maxAttempts
    ) {
      const diff =
        (formatted.year - targetYear) * 365 * 24 * 60 * 60 * 1000 +
        (formatted.month - (targetMonth + 1)) * 30 * 24 * 60 * 60 * 1000 +
        (formatted.day - targetDay) * 24 * 60 * 60 * 1000 +
        (formatted.hour - targetHour) * 60 * 60 * 1000 +
        (formatted.minute - targetMinute) * 60 * 1000 +
        (formatted.second - targetSecond) * 1000;

      // Adjust by the difference (usually finds it in 1-2 iterations)
      utcMs -= diff;
      formatted = getFormattedParts(utcMs);
      attempts++;
    }

    return utcMs;
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
