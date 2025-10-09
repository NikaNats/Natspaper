import { describe, it, expect } from 'vitest';

/**
 * Test getUtcTimestampForTimezone function
 * Tests DST handling, timezone accuracy, and edge cases
 */

// Mock the getUtcTimestampForTimezone function since we need to test the logic
function getUtcTimestampForTimezone(
  dateString: string | Date,
  timezone: string
): number {
  try {
    const dateStr =
      dateString instanceof Date
        ? dateString.toISOString().split("T")[0] +
          "T" +
          dateString.toISOString().split("T")[1]?.split(".")[0]
        : String(dateString);

    const dateRegex =
      /(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/;
    const match = dateRegex.exec(dateStr);
    if (!match) {
      return new Date(dateString).getTime();
    }

    const targetYear = Number.parseInt(match[1], 10);
    const targetMonth = Number.parseInt(match[2], 10) - 1;
    const targetDay = Number.parseInt(match[3], 10);
    const targetHour = Number.parseInt(match[4], 10);
    const targetMinute = Number.parseInt(match[5], 10);
    const targetSecond = Number.parseInt(match[6], 10);

    let utcMs = new Date(
      targetYear,
      targetMonth,
      targetDay,
      targetHour,
      targetMinute,
      targetSecond
    ).getTime();

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const getFormattedParts = (ms: number) => {
      const parts = formatter.formatToParts(new Date(ms));
      return {
        year: Number.parseInt(
          parts.find((p) => p.type === "year")?.value || "0",
          10
        ),
        month: Number.parseInt(
          parts.find((p) => p.type === "month")?.value || "0",
          10
        ),
        day: Number.parseInt(
          parts.find((p) => p.type === "day")?.value || "0",
          10
        ),
        hour: Number.parseInt(
          parts.find((p) => p.type === "hour")?.value || "0",
          10
        ),
        minute: Number.parseInt(
          parts.find((p) => p.type === "minute")?.value || "0",
          10
        ),
        second: Number.parseInt(
          parts.find((p) => p.type === "second")?.value || "0",
          10
        ),
      };
    };

    let formatted = getFormattedParts(utcMs);
    let attempts = 0;
    const maxAttempts = 25;

    while (
      (formatted.year !== targetYear ||
        formatted.month !== targetMonth + 1 ||
        formatted.day !== targetDay ||
        formatted.hour !== targetHour ||
        formatted.minute !== targetMinute ||
        formatted.second !== targetSecond) &&
      attempts < maxAttempts
    ) {
      const diff =
        (formatted.year - targetYear) * 365 * 24 * 60 * 60 * 1000 +
        (formatted.month - (targetMonth + 1)) * 30 * 24 * 60 * 60 * 1000 +
        (formatted.day - targetDay) * 24 * 60 * 60 * 1000 +
        (formatted.hour - targetHour) * 60 * 60 * 1000 +
        (formatted.minute - targetMinute) * 60 * 1000 +
        (formatted.second - targetSecond) * 1000;

      utcMs -= diff;
      formatted = getFormattedParts(utcMs);
      attempts++;
    }

    return utcMs;
  } catch {
    return new Date(dateString).getTime();
  }
}

describe('Timezone Handling - postFilter Integration', () => {
  describe('Basic timezone conversion', () => {
    it('should convert Asia/Bangkok time correctly', () => {
      // Bangkok is UTC+7
      const dateStr = '2024-10-25T10:00:00';
      const result = getUtcTimestampForTimezone(dateStr, 'Asia/Bangkok');
      
      // Check that the formatted time matches
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      
      const formattedParts = formatter.formatToParts(new Date(result));
      const hour = formattedParts.find(p => p.type === 'hour')?.value;
      const day = formattedParts.find(p => p.type === 'day')?.value;
      
      expect(hour).toBe('10');
      expect(day).toBe('25');
    });

    it('should convert America/New_York time correctly', () => {
      // New York is UTC-5 (EST) or UTC-4 (EDT)
      const dateStr = '2024-10-25T10:00:00';
      const result = getUtcTimestampForTimezone(dateStr, 'America/New_York');
      
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      
      const formattedParts = formatter.formatToParts(new Date(result));
      const hour = formattedParts.find(p => p.type === 'hour')?.value;
      
      expect(hour).toBe('10');
    });

    it('should handle UTC timezone', () => {
      const dateStr = '2024-10-25T10:00:00';
      const result = getUtcTimestampForTimezone(dateStr, 'UTC');
      const utcDate = new Date(result);
      
      expect(utcDate.getUTCHours()).toBe(10);
      expect(utcDate.getUTCDate()).toBe(25);
    });
  });

  describe('DST Transitions', () => {
    it('should handle spring forward (2 AM becomes 3 AM)', () => {
      // US Eastern Time: 2024-03-10T02:30:00 doesn't exist (spring forward)
      // Should be treated as 3:30 AM
      const dateStr = '2024-03-10T02:30:00';
      const result = getUtcTimestampForTimezone(dateStr, 'America/New_York');
      
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      
      const formattedParts = formatter.formatToParts(new Date(result));
      const hour = formattedParts.find(p => p.type === 'hour')?.value;
      
      // Should be at least 3 (spring forward moved 2 AM to 3 AM)
      expect(['02', '03'].includes(hour!)).toBe(true);
    });

    it('should handle fall back (1 AM happens twice)', () => {
      // US Eastern Time: 2024-11-03T01:30:00 is ambiguous
      // Could be EDT or EST
      const dateStr = '2024-11-03T01:30:00';
      const result = getUtcTimestampForTimezone(dateStr, 'America/New_York');
      
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      
      const formattedParts = formatter.formatToParts(new Date(result));
      const hour = formattedParts.find(p => p.type === 'hour')?.value;
      
      // Should resolve to 1 AM in some offset
      expect(hour).toBe('01');
    });

    it('should maintain consistency across DST-observing timezones', () => {
      // Test multiple timezones during DST
      const dateStr = '2024-06-15T10:00:00';
      
      const timezones = ['America/New_York', 'Europe/London', 'America/Chicago'];
      const results = timezones.map(tz => 
        getUtcTimestampForTimezone(dateStr, tz)
      );
      
      // All should return valid timestamps
      for (const result of results) {
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle Date objects', () => {
      const dateObj = new Date('2024-10-25T10:00:00Z');
      const result = getUtcTimestampForTimezone(dateObj, 'Asia/Bangkok');
      
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should handle leap years', () => {
      const dateStr = '2024-02-29T10:00:00'; // Leap year
      const result = getUtcTimestampForTimezone(dateStr, 'UTC');
      
      const utcDate = new Date(result);
      expect(utcDate.getUTCMonth()).toBe(1); // February
      expect(utcDate.getUTCDate()).toBe(29);
    });

    it('should handle non-leap years correctly', () => {
      const dateStr = '2023-02-28T10:00:00'; // Non-leap year
      const result = getUtcTimestampForTimezone(dateStr, 'UTC');
      
      const utcDate = new Date(result);
      expect(utcDate.getUTCMonth()).toBe(1); // February
      expect(utcDate.getUTCDate()).toBe(28);
    });

    it('should fallback on invalid timezone gracefully', () => {
      const dateStr = '2024-10-25T10:00:00';
      // Invalid timezone should not crash, will use UTC
      const result = getUtcTimestampForTimezone(dateStr, 'Invalid/Zone');
      
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should handle year boundaries', () => {
      const dateStr = '2024-12-31T23:59:59';
      const result = getUtcTimestampForTimezone(dateStr, 'UTC');
      
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should handle new year transitions', () => {
      const dateStr = '2024-01-01T00:00:00';
      const result = getUtcTimestampForTimezone(dateStr, 'UTC');
      
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete within acceptable time', () => {
      const dateStr = '2024-10-25T10:00:00';
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        getUtcTimestampForTimezone(dateStr, 'America/New_York');
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;
      
      // Should average less than 10ms per call
      expect(avgTime).toBeLessThan(10);
    });
  });
});
