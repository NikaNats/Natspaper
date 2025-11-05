/**
 * Tag Translation System - Hybrid Approach
 *
 * URLs remain unified in English (e.g., /en/tags/web-development and /ka/tags/web-development)
 * Display text is translated per language
 *
 * Example:
 * - URL: /ka/tags/web-development (same for both languages)
 * - Display: "Web Development" (English), "ვებ დეველოპმენტი" (Georgian)
 */

export const tagTranslations: Record<string, Record<string, string>> = {
  en: {
    docs: "docs",
  },
  ka: {
    docs: "დოკუმენტაცია",
  },
};

/**
 * Get the display name for a tag in a specific language
 * Falls back to English slug if translation doesn't exist
 *
 * @param tagSlug - The tag slug in English (e.g., "web-development")
 * @param locale - The language locale (e.g., "en", "ka")
 * @returns The translated tag display name
 *
 * @example
 * getTranslatedTagName("docs", "ka") // Returns "დოკუმენტაცია"
 * getTranslatedTagName("docs", "en") // Returns "docs"
 */
export function getTranslatedTagName(tagSlug: string, locale: string): string {
  const translations = tagTranslations[locale];

  if (!translations) {
    // Fallback to English if locale not found
    return tagTranslations.en[tagSlug] || tagSlug;
  }

  // Return translated name or fallback to English translation or the slug itself
  return (
    translations[tagSlug] ||
    tagTranslations.en[tagSlug] ||
    tagSlug
  );
}

/**
 * Get all translated tags for a specific locale
 * Useful for displaying tag lists with proper translations
 *
 * @param locale - The language locale (e.g., "en", "ka")
 * @param tags - Array of tag slugs in English
 * @returns Array of objects with slug and translated names
 *
 * @example
 * getTranslatedTags("ka", ["docs", "tutorial"])
 * // Returns [
 * //   { slug: "docs", name: "დოკუმენტაცია" },
 * //   { slug: "tutorial", name: "tutorial" } // fallback if no translation
 * // ]
 */
export function getTranslatedTags(
  locale: string,
  tags: string[]
): Array<{ slug: string; name: string }> {
  return tags.map((tag) => ({
    slug: tag,
    name: getTranslatedTagName(tag, locale),
  }));
}
