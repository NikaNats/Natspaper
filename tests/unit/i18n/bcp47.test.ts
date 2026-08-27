// tests/unit/i18n/bcp47.test.ts
import { describe, it, expect } from "vitest";
import {
  canonicalizeLanguageTag,
  isValidBCP47,
  toOpenGraphLocale,
} from "@/utils/i18n/bcp47";
import { LOCALE_CODES } from "@/i18n/config";

describe("RFC 5646 (BCP 47) Language Tag Validation", () => {
  describe("canonicalizeLanguageTag()", () => {
    it("should canonicalize primary language and region subtags", () => {
      expect(canonicalizeLanguageTag("en-us")).toBe("en-US");
      expect(canonicalizeLanguageTag("KA-ge")).toBe("ka-GE");
      expect(canonicalizeLanguageTag("EN_gb")).toBe("en-GB");
    });

    it("should canonicalize 4-letter script subtags to Titlecase", () => {
      expect(canonicalizeLanguageTag("zh-hant-cn")).toBe("zh-Hant-CN");
      expect(canonicalizeLanguageTag("sr-latn-rs")).toBe("sr-Latn-RS");
      expect(canonicalizeLanguageTag("ka-geor-ge")).toBe("ka-Geor-GE");
    });

    it("should handle single primary language tags", () => {
      expect(canonicalizeLanguageTag("EN")).toBe("en");
      expect(canonicalizeLanguageTag("ka")).toBe("ka");
    });

    it("should return 'und' for empty or invalid inputs", () => {
      expect(canonicalizeLanguageTag("")).toBe("und");
      expect(canonicalizeLanguageTag(null as unknown as string)).toBe("und");
    });
  });

  describe("isValidBCP47()", () => {
    it("should validate well-formed BCP 47 tags", () => {
      expect(isValidBCP47("en")).toBe(true);
      expect(isValidBCP47("en-US")).toBe(true);
      expect(isValidBCP47("ka-GE")).toBe(true);
      expect(isValidBCP47("zh-Hans-CN")).toBe(true);
      expect(isValidBCP47("es-419")).toBe(true);
    });

    it("should reject invalid tags", () => {
      expect(isValidBCP47("")).toBe(false);
      expect(isValidBCP47("123")).toBe(false);
      expect(isValidBCP47("en-US-TooLongVariantName")).toBe(false);
    });
  });

  describe("toOpenGraphLocale()", () => {
    it("should convert BCP 47 hyphens to OpenGraph underscores", () => {
      expect(toOpenGraphLocale("en-US")).toBe("en_US");
      expect(toOpenGraphLocale("ka-GE")).toBe("ka_GE");
      expect(toOpenGraphLocale("zh-Hant-TW")).toBe("zh_Hant_TW");
    });
  });

  describe("LOCALE_CODES configuration", () => {
    it("should define valid canonical RFC 5646 tags for all supported languages", () => {
      expect(LOCALE_CODES.en).toBe("en-US");
      expect(LOCALE_CODES.ka).toBe("ka-GE");
      expect(isValidBCP47(LOCALE_CODES.en)).toBe(true);
      expect(isValidBCP47(LOCALE_CODES.ka)).toBe(true);
    });
  });
});
