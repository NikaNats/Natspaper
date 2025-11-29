/**
 * Unit Tests for Reading Time Calculator
 *
 * Tests cover:
 * - calculateReadingTime() with various content lengths
 * - formatReadingTime() for display formatting
 * - getReadingTimeDisplay() convenience function
 * - calculateReadingTimeFromWords() for word count input
 *
 * @module tests/unit/post/readingTime.test
 */

import { describe, it, expect, vi } from "vitest";

// Mock the FEATURES config before importing the module
vi.mock("@/config", () => ({
  FEATURES: {
    readingTimeWPM: 200,
  },
}));

// Import after mock is set up
import {
  calculateReadingTime,
  formatReadingTime,
  getReadingTimeDisplay,
  calculateReadingTimeFromWords,
  type ReadingTimeResult,
} from "@/utils/post/readingTime";

describe("Reading Time Calculator", () => {
  describe("calculateReadingTime()", () => {
    describe("Basic word counting", () => {
      it("should count words correctly", () => {
        const content = "This is a test post with exactly eight words.";
        const result = calculateReadingTime(content);
        // 8 words at 200 WPM = 0.04 min, rounded up to 1
        expect(result.words).toBe(9); // "exactly" counts as one word
        expect(result.minutes).toBe(1);
      });

      it("should return minimum 1 minute for short content", () => {
        const content = "Hello world";
        const result = calculateReadingTime(content);
        expect(result.minutes).toBe(1);
        expect(result.displayText).toBe("1 min read");
      });

      it("should calculate correct time for longer content", () => {
        // 400 words at 200 WPM = 2 minutes
        const words = Array(400).fill("word").join(" ");
        const result = calculateReadingTime(words);
        expect(result.words).toBe(400);
        expect(result.minutes).toBe(2);
        expect(result.displayText).toBe("2 min read");
      });

      it("should round up to next minute", () => {
        // 250 words at 200 WPM = 1.25 min, rounds up to 2
        const words = Array(250).fill("word").join(" ");
        const result = calculateReadingTime(words);
        expect(result.minutes).toBe(2);
      });
    });

    describe("Edge cases", () => {
      it("should handle empty string", () => {
        const result = calculateReadingTime("");
        expect(result.words).toBe(0);
        expect(result.minutes).toBe(1);
        expect(result.displayText).toBe("1 min read");
      });

      it("should handle null/undefined gracefully", () => {
        // TypeScript would catch this, but test runtime behavior
        const result = calculateReadingTime(null as unknown as string);
        expect(result.minutes).toBe(1);
        expect(result.words).toBe(0);
      });

      it("should handle whitespace-only content", () => {
        const result = calculateReadingTime("   \n\t   ");
        expect(result.words).toBe(0);
        expect(result.minutes).toBe(1);
      });

      it("should handle multiple spaces between words", () => {
        const content = "word1    word2     word3";
        const result = calculateReadingTime(content);
        expect(result.words).toBe(3);
      });

      it("should handle newlines and tabs", () => {
        const content = "word1\nword2\tword3\n\nword4";
        const result = calculateReadingTime(content);
        expect(result.words).toBe(4);
      });

      it("should trim leading/trailing whitespace", () => {
        const content = "   hello world   ";
        const result = calculateReadingTime(content);
        expect(result.words).toBe(2);
      });
    });

    describe("Custom WPM", () => {
      it("should use custom words per minute", () => {
        // 100 words at 100 WPM = 1 minute
        const words = Array(100).fill("word").join(" ");
        const result = calculateReadingTime(words, 100);
        expect(result.minutes).toBe(1);
      });

      it("should calculate faster reading speed", () => {
        // 400 words at 400 WPM = 1 minute
        const words = Array(400).fill("word").join(" ");
        const result = calculateReadingTime(words, 400);
        expect(result.minutes).toBe(1);
      });

      it("should calculate slower reading speed", () => {
        // 200 words at 100 WPM = 2 minutes
        const words = Array(200).fill("word").join(" ");
        const result = calculateReadingTime(words, 100);
        expect(result.minutes).toBe(2);
      });
    });

    describe("Content types", () => {
      it("should handle markdown content", () => {
        const markdown = `
# Heading

This is a **bold** paragraph with [a link](https://example.com).

- List item 1
- List item 2

\`\`\`javascript
const code = "example";
\`\`\`
        `.trim();
        const result = calculateReadingTime(markdown);
        expect(result.words).toBeGreaterThan(10);
        expect(result.minutes).toBeGreaterThanOrEqual(1);
      });

      it("should handle HTML content", () => {
        const html =
          "<p>This is <strong>HTML</strong> content with <a href='#'>links</a>.</p>";
        const result = calculateReadingTime(html);
        // HTML tags are counted as words (not stripped)
        expect(result.words).toBeGreaterThan(0);
      });

      it("should handle Unicode content", () => {
        const unicode = "გამარჯობა მსოფლიო! Hello World! 你好世界";
        const result = calculateReadingTime(unicode);
        expect(result.words).toBeGreaterThan(0);
      });

      it("should handle emoji content", () => {
        const emoji = "Hello 👋 World 🌍 Test 🧪";
        const result = calculateReadingTime(emoji);
        expect(result.words).toBeGreaterThan(0);
      });
    });

    describe("Display text formatting", () => {
      it("should format singular minute correctly", () => {
        const content = "short";
        const result = calculateReadingTime(content);
        expect(result.displayText).toBe("1 min read");
      });

      it("should format plural minutes correctly", () => {
        const words = Array(600).fill("word").join(" ");
        const result = calculateReadingTime(words);
        expect(result.displayText).toBe("3 min read");
      });
    });
  });

  describe("formatReadingTime()", () => {
    it("should format result with word count", () => {
      const result: ReadingTimeResult = {
        minutes: 5,
        words: 1000,
        displayText: "5 min read",
      };
      const formatted = formatReadingTime(result);
      expect(formatted).toBe("5 min read • 1,000 words");
    });

    it("should format large word counts with locale separators", () => {
      const result: ReadingTimeResult = {
        minutes: 50,
        words: 10000,
        displayText: "50 min read",
      };
      const formatted = formatReadingTime(result);
      expect(formatted).toBe("50 min read • 10,000 words");
    });

    it("should handle zero words", () => {
      const result: ReadingTimeResult = {
        minutes: 1,
        words: 0,
        displayText: "1 min read",
      };
      const formatted = formatReadingTime(result);
      expect(formatted).toBe("1 min read • 0 words");
    });
  });

  describe("getReadingTimeDisplay()", () => {
    it("should return full format with word count by default", () => {
      const words = Array(500).fill("word").join(" ");
      const result = getReadingTimeDisplay(words);
      expect(result).toMatch(/min read/);
      expect(result).toMatch(/words/);
      expect(result).toMatch(/•/);
    });

    it("should return simple format without word count", () => {
      const words = Array(500).fill("word").join(" ");
      const result = getReadingTimeDisplay(words, false);
      expect(result).toMatch(/min read/);
      expect(result).not.toMatch(/words/);
      expect(result).not.toMatch(/•/);
    });

    it("should handle empty content", () => {
      const result = getReadingTimeDisplay("");
      expect(result).toMatch(/1 min read/);
    });
  });

  describe("calculateReadingTimeFromWords()", () => {
    describe("Basic calculations", () => {
      it("should calculate from word count", () => {
        const result = calculateReadingTimeFromWords(400);
        expect(result.words).toBe(400);
        expect(result.minutes).toBe(2);
        expect(result.displayText).toBe("2 min read");
      });

      it("should return minimum 1 minute", () => {
        const result = calculateReadingTimeFromWords(50);
        expect(result.minutes).toBe(1);
      });

      it("should round up correctly", () => {
        // 250 words at 200 WPM = 1.25 min, rounds to 2
        const result = calculateReadingTimeFromWords(250);
        expect(result.minutes).toBe(2);
      });
    });

    describe("Edge cases", () => {
      it("should handle zero words", () => {
        const result = calculateReadingTimeFromWords(0);
        expect(result.words).toBe(0);
        expect(result.minutes).toBe(1);
      });

      it("should handle negative words", () => {
        const result = calculateReadingTimeFromWords(-100);
        expect(result.minutes).toBe(1);
        expect(result.words).toBe(0);
      });
    });

    describe("Custom WPM", () => {
      it("should use custom reading speed", () => {
        // 100 words at 100 WPM = 1 minute
        const result = calculateReadingTimeFromWords(100, 100);
        expect(result.minutes).toBe(1);
      });

      it("should calculate with fast reading speed", () => {
        // 500 words at 500 WPM = 1 minute
        const result = calculateReadingTimeFromWords(500, 500);
        expect(result.minutes).toBe(1);
      });
    });

    describe("Display text", () => {
      it("should format singular minute", () => {
        const result = calculateReadingTimeFromWords(100);
        expect(result.displayText).toBe("1 min read");
      });

      it("should format plural minutes", () => {
        const result = calculateReadingTimeFromWords(1000);
        expect(result.displayText).toBe("5 min read");
      });
    });
  });

  describe("Integration scenarios", () => {
    it("should produce consistent results for same content", () => {
      const content = "This is a consistent test with multiple words.";
      const result1 = calculateReadingTime(content);
      const result2 = calculateReadingTime(content);
      expect(result1).toEqual(result2);
    });

    it("should handle real blog post content", () => {
      const blogPost = `
# Introduction to TypeScript

TypeScript is a strongly typed programming language that builds on JavaScript, 
giving you better tooling at any scale.

## Why TypeScript?

TypeScript adds additional syntax to JavaScript to support a tighter integration 
with your editor. Catch errors early in your editor.

### Key Benefits

1. **Type Safety**: Catch errors at compile time
2. **Better IDE Support**: Autocompletion and refactoring
3. **Self-documenting Code**: Types serve as documentation

## Getting Started

To get started with TypeScript, you can install it via npm:

\`\`\`bash
npm install -g typescript
\`\`\`

Then create a simple \`hello.ts\` file and compile it.
      `.trim();

      const result = calculateReadingTime(blogPost);
      expect(result.words).toBeGreaterThan(50);
      expect(result.minutes).toBeGreaterThanOrEqual(1);
      expect(result.displayText).toMatch(/min read/);
    });
  });
});
