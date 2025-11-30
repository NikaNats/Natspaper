/**
 * Unit Tests for Date Formatting Utilities
 *
 * Tests cover:
 * - formatDate() with various locales and formats
 * - formatNumber() for locale-aware number formatting
 * - formatReadingTimeLocalized() for reading time display
 * - formatRelativeTime() for relative date descriptions
 *
 * @module tests/unit/i18n/date.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatDate,
  formatNumber,
  formatReadingTimeLocalized,
  formatRelativeTime,
  DATE_FORMATS,
} from "@/utils/i18n/date";

const testDate = new Date("2024-12-25T12:00:00Z");

/**
 * Test formatDate with English locale
 */
function testFormatDateEnglish() {
  it("should format date in short format", () => {
    const result = formatDate(testDate, "en", "short");
    expect(result).toMatch(/Dec/i);
    expect(result).toMatch(/25/);
    expect(result).toMatch(/2024/);
  });

  it("should format date in long format", () => {
    const result = formatDate(testDate, "en", "long");
    expect(result).toMatch(/December/i);
    expect(result).toMatch(/25/);
    expect(result).toMatch(/2024/);
  });

  it("should default to short format when not specified", () => {
    const result = formatDate(testDate, "en");
    expect(result).toMatch(/Dec/i);
  });
}

/**
 * Test formatDate with Georgian locale
 */
function testFormatDateGeorgian() {
  it("should format date in short format with Georgian month", () => {
    const result = formatDate(testDate, "ka", "short");
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/25/);
    expect(result).toMatch(/2024/);
  });

  it("should format date in long format with Georgian month", () => {
    const result = formatDate(testDate, "ka", "long");
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });
}

/**
 * Test formatDate input types
 */
function testFormatDateInputTypes() {
  it("should accept Date object", () => {
    const result = formatDate(new Date("2024-01-15"), "en", "short");
    expect(result).toMatch(/Jan/i);
    expect(result).toMatch(/15/);
  });

  it("should accept date string", () => {
    const result = formatDate("2024-06-20", "en", "short");
    expect(result).toMatch(/Jun/i);
    expect(result).toMatch(/20/);
  });

  it("should accept timestamp number", () => {
    const timestamp = new Date("2024-03-10").getTime();
    const result = formatDate(timestamp, "en", "short");
    expect(result).toMatch(/Mar/i);
    expect(result).toMatch(/10/);
  });
}

/**
 * Test formatDate edge cases
 */
function testFormatDateEdgeCases() {
  it("should handle invalid date gracefully", () => {
    expect(() => formatDate("invalid-date", "en")).not.toThrow();
  });

  it("should handle year boundaries", () => {
    const newYear = new Date("2025-01-01");
    const result = formatDate(newYear, "en", "short");
    expect(result).toMatch(/2025/);
    expect(result).toMatch(/Jan/i);
  });

  it("should handle leap year date", () => {
    const leapDay = new Date("2024-02-29");
    const result = formatDate(leapDay, "en", "short");
    expect(result).toMatch(/Feb/i);
    expect(result).toMatch(/29/);
  });
}

/**
 * Test formatRelativeTime with English locale
 */
function testFormatRelativeTimeEnglish() {
  it("should return 'today' for current date", () => {
    const today = new Date("2024-12-25T10:00:00Z");
    const result = formatRelativeTime(today, "en");
    expect(result.toLowerCase()).toMatch(/today/);
  });

  it("should return 'yesterday' for previous day", () => {
    const yesterday = new Date("2024-12-24T12:00:00Z");
    const result = formatRelativeTime(yesterday, "en");
    expect(result.toLowerCase()).toMatch(/yesterday/);
  });

  it("should return days ago for recent dates", () => {
    const threeDaysAgo = new Date("2024-12-22T12:00:00Z");
    const result = formatRelativeTime(threeDaysAgo, "en");
    expect(result.toLowerCase()).toMatch(/3|three/);
    expect(result.toLowerCase()).toMatch(/day/);
  });

  it("should return weeks ago for dates 7-30 days old", () => {
    const twoWeeksAgo = new Date("2024-12-11T12:00:00Z");
    const result = formatRelativeTime(twoWeeksAgo, "en");
    expect(result.toLowerCase()).toMatch(/2|two/);
    expect(result.toLowerCase()).toMatch(/week/);
  });

  it("should return months ago for dates 30-365 days old", () => {
    const twoMonthsAgo = new Date("2024-10-25T12:00:00Z");
    const result = formatRelativeTime(twoMonthsAgo, "en");
    expect(result.toLowerCase()).toMatch(/month/);
  });

  it("should return years ago for old dates", () => {
    const twoYearsAgo = new Date("2022-12-25T12:00:00Z");
    const result = formatRelativeTime(twoYearsAgo, "en");
    expect(result.toLowerCase()).toMatch(/year/);
  });
}

/**
 * Test formatRelativeTime with Georgian locale
 */
function testFormatRelativeTimeGeorgian() {
  it("should return Georgian relative time", () => {
    const yesterday = new Date("2024-12-24T12:00:00Z");
    const result = formatRelativeTime(yesterday, "ka");
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });
}

/**
 * Test formatRelativeTime input types
 */
function testFormatRelativeTimeInputTypes() {
  it("should accept Date object", () => {
    const date = new Date("2024-12-24T12:00:00Z");
    expect(() => formatRelativeTime(date, "en")).not.toThrow();
  });

  it("should accept date string", () => {
    expect(() => formatRelativeTime("2024-12-24", "en")).not.toThrow();
  });

  it("should accept timestamp", () => {
    const timestamp = new Date("2024-12-24").getTime();
    expect(() => formatRelativeTime(timestamp, "en")).not.toThrow();
  });
}

describe("Date Formatting Utilities", () => {
  describe("formatDate()", () => {
    describe("English locale", testFormatDateEnglish);
    describe("Georgian locale", testFormatDateGeorgian);
    describe("Input types", testFormatDateInputTypes);
    describe("Edge cases", testFormatDateEdgeCases);
  });


  describe("formatNumber()", () => {
    describe("English locale", () => {
      it("should format thousands with comma separator", () => {
        const result = formatNumber(1234, "en");
        expect(result).toBe("1,234");
      });

      it("should format millions", () => {
        const result = formatNumber(1234567, "en");
        expect(result).toBe("1,234,567");
      });

      it("should handle small numbers without separator", () => {
        const result = formatNumber(123, "en");
        expect(result).toBe("123");
      });

      it("should handle zero", () => {
        const result = formatNumber(0, "en");
        expect(result).toBe("0");
      });

      it("should handle negative numbers", () => {
        const result = formatNumber(-1234, "en");
        expect(result).toMatch(/-1,234/);
      });
    });

    describe("Georgian locale", () => {
      it("should format numbers according to Georgian conventions", () => {
        const result = formatNumber(1234, "ka");
        // Georgian may use different separators
        expect(result).toBeTruthy();
        expect(result.replaceAll(/\D/g, "")).toBe("1234");
      });
    });

    describe("with options", () => {
      it("should respect decimal options", () => {
        const result = formatNumber(1234.567, "en", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        expect(result).toBe("1,234.57");
      });

      it("should format as currency when specified", () => {
        const result = formatNumber(99.99, "en", {
          style: "currency",
          currency: "USD",
        });
        expect(result).toMatch(/\$99\.99/);
      });

      it("should format as percentage", () => {
        const result = formatNumber(0.75, "en", { style: "percent" });
        expect(result).toBe("75%");
      });
    });
  });

  describe("formatReadingTimeLocalized()", () => {
    it("should format reading time with English suffix", () => {
      const result = formatReadingTimeLocalized(5, "en", "min read");
      expect(result).toBe("5 min read");
    });

    it("should format reading time with Georgian suffix", () => {
      const result = formatReadingTimeLocalized(5, "ka", "წთ კითხვა");
      expect(result).toMatch(/5/);
      expect(result).toMatch(/წთ კითხვა/);
    });

    it("should round up fractional minutes", () => {
      const result = formatReadingTimeLocalized(4.3, "en", "min read");
      expect(result).toBe("5 min read");
    });

    it("should handle 1 minute", () => {
      const result = formatReadingTimeLocalized(1, "en", "min read");
      expect(result).toBe("1 min read");
    });

    it("should handle large reading times", () => {
      const result = formatReadingTimeLocalized(45, "en", "min read");
      expect(result).toBe("45 min read");
    });

    it("should format number according to locale", () => {
      const result = formatReadingTimeLocalized(1234, "en", "min read");
      expect(result).toBe("1,234 min read");
    });
  });

  describe("formatRelativeTime()", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-12-25T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe("English locale", testFormatRelativeTimeEnglish);
    describe("Georgian locale", testFormatRelativeTimeGeorgian);
    describe("Input types", testFormatRelativeTimeInputTypes);
  });

  describe("DATE_FORMATS constant", () => {
    it("should have short format for both locales", () => {
      expect(DATE_FORMATS.short.en).toBeDefined();
      expect(DATE_FORMATS.short.ka).toBeDefined();
    });

    it("should have long format for both locales", () => {
      expect(DATE_FORMATS.long.en).toBeDefined();
      expect(DATE_FORMATS.long.ka).toBeDefined();
    });

    it("should have iso format for both locales", () => {
      expect(DATE_FORMATS.iso.en).toBeDefined();
      expect(DATE_FORMATS.iso.ka).toBeDefined();
    });

    it("short format should include day, month, year", () => {
      expect(DATE_FORMATS.short.en).toMatchObject({
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    });

    it("long format should include full month name", () => {
      expect(DATE_FORMATS.long.en).toMatchObject({
        month: "long",
      });
    });
  });
});
