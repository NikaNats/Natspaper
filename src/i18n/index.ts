import { defaultLang, languages, supportedLangs } from "./config";
import type { Lang } from "./config";
export type { Lang };
import { ui } from "./dictionaries/ui";
import { tagTranslations } from "./dictionaries/tags";

/**
 * Creates a generic translator function for a given dictionary.
 * This function encapsulates the fallback logic (current lang -> default lang -> key).
 * This is a pure, reusable helper that follows the SRP.
 */
function createTranslator(
  locale: Lang,
  dictionary: Record<string, Record<string, string>>
) {
  return function t(key: string): string {
    return dictionary[locale]?.[key] || dictionary[defaultLang]?.[key] || key;
  };
}

/**
 * Returns a set of i18n helpers for a given locale.
 * This is the main function you will use in your components.
 */
export function getI18n(locale: Lang | undefined) {
  const lang = locale && supportedLangs.includes(locale) ? locale : defaultLang;

  return {
    /** Translator for UI strings */
    t: createTranslator(lang, ui as Record<string, Record<string, string>>),
    /** Translator for tag names */
    tTag: createTranslator(
      lang,
      tagTranslations as Record<string, Record<string, string>>
    ),
    /** The current language code */
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
