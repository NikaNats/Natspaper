import { defaultLang, languages, supportedLangs, LOCALE_CODES } from "./config";
import type { Lang } from "./config";
export type { Lang };
export { LOCALE_CODES };
import { ui, type UIKey } from "./dictionaries/ui";
import { tagTranslations } from "./dictionaries/tags";

/**
 * Type-safe translation function type
 * Returns exact string type for known keys
 */
type TranslationFunction = {
  (key: UIKey): string;
  /**
   * Template replacement for pagination patterns like "Page {current} of {total}"
   */
  (key: UIKey, replacements: Record<string, string | number>): string;
};

/**
 * Creates a strongly-typed translator function for UI strings.
 * Provides fallback logic: current lang -> default lang -> key itself
 */
function createUITranslator(locale: Lang): TranslationFunction {
  return function t(
    key: UIKey,
    replacements?: Record<string, string | number>
  ): string {
    // Type-safe lookup with fallback chain
    const translation: string =
      ui[locale]?.[key] ?? ui[defaultLang]?.[key] ?? key;

    // Handle template replacements like "Page {current} of {total}"
    if (replacements) {
      let result = translation;
      for (const [placeholder, value] of Object.entries(replacements)) {
        result = result.replace(
          new RegExp(`\\{${placeholder}\\}`, "g"),
          String(value)
        );
      }
      return result;
    }

    return translation;
  };
}

/**
 * Creates a generic translator function for tag dictionaries.
 * This function encapsulates the fallback logic (current lang -> default lang -> key).
 */
function createTagTranslator(locale: Lang): (tag: string) => string {
  return function tTag(tag: string): string {
    const dict = tagTranslations as Record<string, Record<string, string>>;
    return dict[locale]?.[tag] ?? dict[defaultLang]?.[tag] ?? tag;
  };
}

/**
 * I18n helper result type for strong typing
 */
export interface I18nHelpers {
  /** Strongly-typed translator for UI strings */
  t: TranslationFunction;
  /** Translator for tag names */
  tTag: (tag: string) => string;
  /** The current language code */
  lang: Lang;
}

/**
 * Returns a set of i18n helpers for a given locale.
 * This is the main function you will use in your components.
 *
 * @example
 * ```astro
 * const { t, tTag, lang } = getI18n(Astro.currentLocale as Lang);
 * // t('nav.home') -> "Home" or "მთავარი"
 * // t('pagination.pageOf', { current: 1, total: 5 }) -> "Page 1 of 5"
 * ```
 */
export function getI18n(locale: Lang | undefined): I18nHelpers {
  const lang = locale && supportedLangs.includes(locale) ? locale : defaultLang;

  return {
    t: createUITranslator(lang),
    tTag: createTagTranslator(lang),
    lang,
  };
}

// --- Static Utility Functions ---

export function getLanguages() {
  return languages;
}

export function getDefaultLanguage(): Lang {
  return defaultLang;
}

export function isValidLanguage(lang: unknown): lang is Lang {
  return typeof lang === "string" && supportedLangs.includes(lang as Lang);
}

export function getCurrentLocale(pathname: string): Lang | undefined {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return isValidLanguage(firstSegment) ? firstSegment : undefined;
}
