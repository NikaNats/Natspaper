/**
 * Internationalization (i18n) Configuration
 * Single Source of Truth for languages and locale settings.
 */

// 1. Define the languages map first to derive types from it
export const LANGUAGES = {
  en: "English",
  ka: "ქართული",
} as const;

// 2. Derive the type from the object keys
export type Lang = keyof typeof LANGUAGES;

// 3. Define the default language
export const DEFAULT_LANG: Lang = "en";

// 4. Generate helper arrays for config consumption
export const SUPPORTED_LANGS = Object.keys(LANGUAGES) as Lang[];

// 5. Define locale codes for HTML lang attribute (optional, if different from keys)
export const LOCALE_CODES: Record<Lang, string> = {
  en: "en-US",
  ka: "ka-GE",
};

// Legacy exports for backward compatibility
export const defaultLang = DEFAULT_LANG;
export const languages = LANGUAGES;
export const supportedLangs = SUPPORTED_LANGS;
