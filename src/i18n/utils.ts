/**
 * i18n Utilities - Helper functions for translation
 *
 * This module provides utility functions for working with translations
 * in Astro components and layouts.
 */

import { ui, defaultLang } from "./ui";
import type { Lang, UIKey } from "./ui";

/**
 * Create a translation function for a specific language
 *
 * @param lang - The language code (e.g., 'en', 'ka')
 * @returns A function that translates UI keys, falling back to the default language
 *
 * @example
 * const t = useTranslations('en');
 * const greeting = t('nav.posts'); // "Posts"
 */
export function useTranslations(lang: Lang = defaultLang) {
  return function t(key: UIKey): string {
    // Try to get the translation for the requested language
    if (lang in ui && key in ui[lang]) {
      return ui[lang][key];
    }
    // Fall back to the default language if key not found
    if (key in ui[defaultLang]) {
      return ui[defaultLang][key];
    }
    // If key doesn't exist in any language, return the key itself (for debugging)
    // eslint-disable-next-line no-console
    console.warn(`Translation key not found: ${key}`);
    return key;
  };
}

/**
 * Get all available languages and their display names
 *
 * @returns An object mapping language codes to their display names
 *
 * @example
 * const langs = getLanguages();
 * // { en: 'English', ka: 'ქართული' }
 */
export function getLanguages() {
  return {
    en: "English",
    ka: "ქართული",
  } as const;
}

/**
 * Get the default language code
 *
 * @returns The default language code
 */
export function getDefaultLanguage(): Lang {
  return defaultLang;
}

/**
 * Check if a given language code is supported
 *
 * @param lang - The language code to check
 * @returns True if the language is supported
 */
export function isValidLanguage(lang: unknown): lang is Lang {
  return lang === "en" || lang === "ka";
}

/**
 * Get the current locale from a pathname
 *
 * @param pathname - The pathname to extract locale from (e.g., '/en/posts/123')
 * @returns The locale if found, undefined otherwise
 *
 * @example
 * getCurrentLocale('/en/posts/123'); // 'en'
 * getCurrentLocale('/ka/blog'); // 'ka'
 * getCurrentLocale('/posts/123'); // undefined
 */
export function getCurrentLocale(pathname: string): Lang | undefined {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (isValidLanguage(firstSegment)) {
    return firstSegment;
  }

  return undefined;
}
