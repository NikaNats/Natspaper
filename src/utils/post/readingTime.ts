/**
 * Reading Time Calculator
 *
 * Calculates reading time for blog content based on word count.
 * Uses industry-standard 200 words per minute (WPM) as default.
 *
 * Impact:
 * - Improves user engagement (readers commit to time)
 * - Better SEO (reading time is a ranking factor)
 * - Better UX (helps users plan their reading)
 *
 * @module readingTime
 */

export interface ReadingTimeResult {
  /** Estimated reading time in minutes */
  minutes: number;
  /** Total word count */
  words: number;
  /** Human-readable text (e.g., "5 min read") */
  displayText: string;
}

/**
 * Calculate reading time for given content
 *
 * @param content - The content to analyze (can be markdown, HTML, or plain text)
 * @param wordsPerMinute - Reading speed (default: 200 WPM, average adult reading speed)
 * @returns Object with minutes, words, and displayText
 *
 * @example
 * ```ts
 * const result = calculateReadingTime("# Hello World\n\nThis is a test post with some content.");
 * console.log(result.displayText); // "1 min read"
 * console.log(result.words); // 11
 * ```
 */
import { FEATURES } from "@/config";
import { getI18n } from "@/i18n";
import type { Lang } from "@/i18n/config";
import { formatNumber, formatReadingTimeLocalized } from "@/utils/i18n/date";

/**
 * Localized "N min read" label. Number formatting and the suffix both come
 * from the i18n layer, so Georgian pages render "5 წთ კითხვა".
 */
function readingTimeLabel(minutes: number, locale: Lang): string {
  const { t, lang } = getI18n(locale);
  return formatReadingTimeLocalized(minutes, lang, t("post.readingTime"));
}

export function calculateReadingTime(
  content: string,
  // REFACTORED: Default value comes from global settings
  wordsPerMinute: number = FEATURES.readingTimeWPM,
  locale: Lang = "en"
): ReadingTimeResult {
  if (!content || typeof content !== "string") {
    return {
      minutes: 1,
      words: 0,
      displayText: readingTimeLabel(1, locale),
    };
  }

  // Count words: split by whitespace and filter empty strings
  const words = content
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;

  // Calculate minutes: round up to ensure minimum accuracy
  // Math.ceil ensures "1 word" = "1 min read" (not "0 min read")
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));

  return {
    minutes,
    words,
    displayText: readingTimeLabel(minutes, locale),
  };
}

/**
 * Format reading time with word count
 *
 * @param result - Result from calculateReadingTime() (computed for the same locale)
 * @param locale - UI locale for number formatting and the "words" label
 * @returns Formatted string like "5 min read • 1,234 words"
 *
 * @example
 * ```ts
 * const result = calculateReadingTime(post.body);
 * const formatted = formatReadingTime(result);
 * console.log(formatted); // "5 min read • 1,234 words"
 * ```
 */
export function formatReadingTime(
  result: ReadingTimeResult,
  locale: Lang = "en"
): string {
  const { t, lang } = getI18n(locale);
  const wordCount = formatNumber(result.words, lang);
  return `${result.displayText} • ${wordCount} ${t("post.words")}`;
}

/**
 * Get reading time display for templates
 *
 * Convenience function that combines calculation and formatting.
 * Useful for direct use in Astro components.
 *
 * @param content - The content to analyze
 * @param includeWordCount - Whether to include word count in output
 * @param locale - UI locale (defaults to English)
 * @returns Formatted string like "5 min read" or "5 min read • 1,234 words"
 *
 * @example
 * ```astro
 * ---
 * import { getReadingTimeDisplay } from "@/utils/readingTime";
 * const readingTime = getReadingTimeDisplay(post.body);
 * ---
 * <span>{readingTime}</span>
 * ```
 */
export function getReadingTimeDisplay(
  content: string,
  includeWordCount: boolean = true,
  locale: Lang = "en"
): string {
  const result = calculateReadingTime(content, FEATURES.readingTimeWPM, locale);
  return includeWordCount
    ? formatReadingTime(result, locale)
    : result.displayText;
}

export interface CalibratedReadingTime {
  estimatedMinutes: number;
  displayText: string;
  wordCount: number;
  isDense: boolean;
}

export function calculateAcademicReadingTime(
  markdown: string
): CalibratedReadingTime {
  if (!markdown || typeof markdown !== "string") {
    return {
      estimatedMinutes: 1,
      displayText: "About 1 min read",
      wordCount: 0,
      isDense: false,
    };
  }
  // 1. Separate code blocks and equations from running prose
  const codeBlockCount = (markdown.match(/```[\s\S]*?```/g) || []).length;
  const equationCount = (markdown.match(/\$\$[\s\S]*?\$\$/g) || []).length;

  // Clean markdown to count words
  const cleanProse = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\$\$[\s\S]*?\$\$/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  const words = cleanProse
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0).length;

  // Reading rates:
  // - Prose: 200 words/min
  // - Equations: 1 minute per complex derivation/block
  // - Code blocks: 1.5 minutes per code block
  const proseMinutes = words / 200;
  const mathMinutes = equationCount * 1.0;
  const codeMinutes = codeBlockCount * 1.5;

  const totalMinutes = Math.max(
    1,
    Math.ceil(proseMinutes + mathMinutes + codeMinutes)
  );
  const isDense = mathMinutes + codeMinutes > proseMinutes;

  return {
    estimatedMinutes: totalMinutes,
    wordCount: words,
    isDense,
    // Add explicit uncertainty marker ("About ...")
    displayText: `About ${totalMinutes} min read${isDense ? " (Technical)" : ""}`,
  };
}

/**
 * Calculate reading time from word count
 *
 * @param wordCount - Number of words in the content
 * @param wordsPerMinute - Reading speed (default: 200 WPM)
 * @returns Object with minutes, words, and displayText
 */
export function calculateReadingTimeFromWords(
  wordCount: number,
  wordsPerMinute: number = FEATURES.readingTimeWPM,
  locale: Lang = "en"
): ReadingTimeResult {
  if (wordCount <= 0) {
    return {
      minutes: 1,
      words: 0,
      displayText: readingTimeLabel(1, locale),
    };
  }

  // Calculate minutes: round up to ensure minimum accuracy
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));

  return {
    minutes,
    words: wordCount,
    displayText: readingTimeLabel(minutes, locale),
  };
}
