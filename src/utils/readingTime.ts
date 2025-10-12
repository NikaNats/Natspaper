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
export function calculateReadingTime(
  content: string,
  wordsPerMinute: number = 200
): ReadingTimeResult {
  if (!content || typeof content !== "string") {
    return {
      minutes: 1,
      words: 0,
      displayText: "1 min read",
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
    displayText: minutes === 1 ? "1 min read" : `${minutes} min read`,
  };
}

/**
 * Format reading time with word count
 * 
 * @param result - Result from calculateReadingTime()
 * @returns Formatted string like "5 min read • 1,234 words"
 * 
 * @example
 * ```ts
 * const result = calculateReadingTime(post.body);
 * const formatted = formatReadingTime(result);
 * console.log(formatted); // "5 min read • 1,234 words"
 * ```
 */
export function formatReadingTime(result: ReadingTimeResult): string {
  const wordCount = result.words.toLocaleString();
  return `${result.displayText} • ${wordCount} words`;
}

/**
 * Get reading time display for templates
 * 
 * Convenience function that combines calculation and formatting.
 * Useful for direct use in Astro components.
 * 
 * @param content - The content to analyze
 * @param includeWordCount - Whether to include word count in output
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
  includeWordCount: boolean = true
): string {
  const result = calculateReadingTime(content);
  return includeWordCount ? formatReadingTime(result) : result.displayText;
}
