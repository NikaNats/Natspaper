// src/utils/i18n/bcp47.ts

/**
 * RFC 5646 (BCP 47) Language Tag Utilities
 * ========================================
 * Implements syntax parsing, canonical casing, and validation
 * in accordance with IETF RFC 5646.
 */

export interface ParsedLanguageTag {
  language: string;
  script?: string;
  region?: string;
  variants: string[];
  raw: string;
}

/**
 * Formats subtags into canonical RFC 5646 casing:
 * - Primary language: lowercase (e.g., "en", "ka")
 * - Script: Titlecase (e.g., "Latn", "Geor")
 * - Region: UPPERCASE (e.g., "US", "GE")
 * - Variants: lowercase (e.g., "1901", "biske")
 */
export function canonicalizeLanguageTag(tag: string): string {
  if (!tag || typeof tag !== "string") return "und";

  const segments = tag.trim().replace(/_/g, "-").split("-");
  if (segments.length === 0 || !segments[0]) return "und";

  const normalizedSegments: string[] = [];

  // Primary language subtag (2-3 letters or registered length)
  normalizedSegments.push(segments[0].toLowerCase());

  for (let i = 1; i < segments.length; i++) {
    const subtag = segments[i]!;

    // 4-letter subtag -> Script (Titlecase)
    if (subtag.length === 4 && /^[a-zA-Z]+$/.test(subtag)) {
      normalizedSegments.push(
        subtag.charAt(0).toUpperCase() + subtag.slice(1).toLowerCase()
      );
    }
    // 2-letter subtag -> Region (UPPERCASE)
    else if (subtag.length === 2 && /^[a-zA-Z]+$/.test(subtag)) {
      normalizedSegments.push(subtag.toUpperCase());
    }
    // 3-digit subtag -> UN M.49 Region code
    else if (subtag.length === 3 && /^\d+$/.test(subtag)) {
      normalizedSegments.push(subtag);
    }
    // Default / Variants / Extensions -> lowercase
    else {
      normalizedSegments.push(subtag.toLowerCase());
    }
  }

  return normalizedSegments.join("-");
}

/**
 * Validates whether a tag adheres to basic RFC 5646 ABNF grammar.
 */
export function isValidBCP47(tag: string): boolean {
  if (!tag || typeof tag !== "string") return false;

  // RFC 5646 Section 2.1 ABNF regex (Standard subset)
  const bcp47Regex =
    /^[a-z]{2,3}(-[a-z]{3}){0,3}(-[A-Z][a-z]{3})?(-([A-Z]{2}|\d{3}))?(-([a-z\d]{5,8}|\d[a-z\d]{3}))*$/i;

  return bcp47Regex.test(tag.trim().replace(/_/g, "-"));
}

/**
 * Converts RFC 5646 hyphenated tag to OpenGraph underscore format (e.g., "en-US" -> "en_US").
 */
export function toOpenGraphLocale(tag: string): string {
  const canonical = canonicalizeLanguageTag(tag);
  return canonical.replace(/-/g, "_");
}
