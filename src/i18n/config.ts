// src/i18n/config.ts
import { canonicalizeLanguageTag } from "@/utils/i18n/bcp47";

/**
 * Master Internationalization (i18n) Configuration
 * Conforms strictly to IETF RFC 5646 (BCP 47).
 */

export const LANGUAGES = {
  en: "English",
  ka: "ქართული",
} as const;

export type Lang = keyof typeof LANGUAGES;

export const DEFAULT_LANG: Lang = "en";

export const SUPPORTED_LANGS = Object.keys(LANGUAGES) as Lang[];

/**
 * RFC 5646 Canonical Language Tags
 * - "en-US": English as used in the United States
 * - "ka-GE": Georgian as used in Georgia
 */
export const LOCALE_CODES: Record<Lang, string> = {
  en: canonicalizeLanguageTag("en-US"),
  ka: canonicalizeLanguageTag("ka-GE"),
};

// Aliases for backward compatibility
export const defaultLang = DEFAULT_LANG;
export const languages = LANGUAGES;
export const supportedLangs = SUPPORTED_LANGS;
