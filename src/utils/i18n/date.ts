/**
 * Locale-Aware Date Formatting Utilities
 *
 * Uses Intl.DateTimeFormat for proper locale-aware date formatting.
 * Georgian dates use DD.MM.YYYY format while English uses MMM DD, YYYY.
 */

import type { Lang } from "@/i18n/config";
import { LOCALE_CODES } from "@/i18n/config";

/**
 * Date format options for different display contexts
 */
export const DATE_FORMATS = {
  /** Short format: "Dec 25, 2024" or "25 დეკ, 2024" */
  short: {
    en: { day: "numeric", month: "short", year: "numeric" } as const,
    ka: { day: "numeric", month: "short", year: "numeric" } as const,
  },
  /** Long format: "December 25, 2024" or "25 დეკემბერი, 2024" */
  long: {
    en: { day: "numeric", month: "long", year: "numeric" } as const,
    ka: { day: "numeric", month: "long", year: "numeric" } as const,
  },
  /** ISO format for datetime attributes */
  iso: {
    en: { dateStyle: "short" } as const,
    ka: { dateStyle: "short" } as const,
  },
} as const;

type DateFormatType = keyof typeof DATE_FORMATS;

/**
 * Format a date according to the specified locale
 *
 * @param date - Date to format (Date object, string, or timestamp)
 * @param locale - Target locale ('en' or 'ka')
 * @param format - Format type ('short' | 'long' | 'iso')
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date(), 'en', 'short') // "Dec 25, 2024"
 * formatDate(new Date(), 'ka', 'short') // "25 დეკ. 2024"
 */
export function formatDate(
  date: Date | string | number,
  locale: Lang,
  format: DateFormatType = "short"
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  // Get the full locale code (e.g., "en-US", "ka-GE")
  const localeCode = LOCALE_CODES[locale] ?? locale;

  // Get format options for this locale and format type
  const options = DATE_FORMATS[format][locale];

  try {
    return new Intl.DateTimeFormat(localeCode, options).format(dateObj);
  } catch {
    // Fallback to ISO string if formatting fails
    return dateObj.toLocaleDateString(localeCode);
  }
}

/**
 * Format a number according to the specified locale
 *
 * @param value - Number to format
 * @param locale - Target locale ('en' or 'ka')
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1234, 'en') // "1,234"
 * formatNumber(1234, 'ka') // "1 234" (Georgian uses space as separator)
 */
export function formatNumber(
  value: number,
  locale: Lang,
  options?: Intl.NumberFormatOptions
): string {
  const localeCode = LOCALE_CODES[locale] ?? locale;

  try {
    return new Intl.NumberFormat(localeCode, options).format(value);
  } catch {
    return value.toString();
  }
}

/**
 * Format reading time with locale-aware number formatting
 *
 * @param minutes - Reading time in minutes
 * @param locale - Target locale
 * @param suffix - Suffix to append (e.g., "min read" or "წთ კითხვა")
 * @returns Formatted reading time string
 */
export function formatReadingTimeLocalized(
  minutes: number,
  locale: Lang,
  suffix: string
): string {
  const formattedNumber = formatNumber(Math.ceil(minutes), locale);
  return `${formattedNumber} ${suffix}`;
}

/**
 * Get relative time description (e.g., "2 days ago", "2 დღის წინ")
 *
 * @param date - Date to compare
 * @param locale - Target locale
 * @returns Relative time string
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: Lang
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const localeCode = LOCALE_CODES[locale] ?? locale;

  try {
    const rtf = new Intl.RelativeTimeFormat(localeCode, { numeric: "auto" });

    if (diffDays === 0) {
      return rtf.format(0, "day"); // "today" / "დღეს"
    } else if (diffDays === 1) {
      return rtf.format(-1, "day"); // "yesterday" / "გუშინ"
    } else if (diffDays < 7) {
      return rtf.format(-diffDays, "day");
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return rtf.format(-weeks, "week");
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return rtf.format(-months, "month");
    } else {
      const years = Math.floor(diffDays / 365);
      return rtf.format(-years, "year");
    }
  } catch {
    // Fallback for browsers without RelativeTimeFormat support
    return formatDate(dateObj, locale, "short");
  }
}
