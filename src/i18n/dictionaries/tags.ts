/**
 * Tag Translation System - Hybrid Approach
 *
 * URLs remain unified in English (e.g., /en/tags/web-development and /ka/tags/web-development)
 * Display text is translated per language
 */

export const tagTranslations = {
  en: {
    docs: "docs",
  },
  ka: {
    docs: "დოკუმენტაცია",
  },
} as const;
