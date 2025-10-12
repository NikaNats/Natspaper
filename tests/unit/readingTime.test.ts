import { describe, it, expect } from "vitest";
import {
  calculateReadingTime,
  formatReadingTime,
  getReadingTimeDisplay,
} from "@/utils/readingTime";

describe("readingTime", () => {
  describe("calculateReadingTime", () => {
    it("should calculate reading time for short content (1 minute)", () => {
      const content = "Hello world";
      const result = calculateReadingTime(content);

      expect(result.minutes).toBe(1);
      expect(result.words).toBe(2);
      expect(result.displayText).toBe("1 min read");
    });

    it("should calculate reading time for medium content (5 minutes)", () => {
      // 1000 words / 200 WPM = 5 minutes
      const content = new Array(1000).fill("word").join(" ");
      const result = calculateReadingTime(content);

      expect(result.minutes).toBe(5);
      expect(result.words).toBe(1000);
      expect(result.displayText).toBe("5 min read");
    });

    it("should calculate reading time for long content (10+ minutes)", () => {
      // 2500 words / 200 WPM = 12.5 minutes (rounded up to 13)
      const content = new Array(2500).fill("word").join(" ");
      const result = calculateReadingTime(content);

      expect(result.minutes).toBe(13);
      expect(result.words).toBe(2500);
      expect(result.displayText).toBe("13 min read");
    });

    it("should handle empty content gracefully", () => {
      const result = calculateReadingTime("");

      expect(result.minutes).toBe(1);
      expect(result.words).toBe(0);
      expect(result.displayText).toBe("1 min read");
    });

    it("should handle whitespace-only content", () => {
      const result = calculateReadingTime("   \n\t   ");

      expect(result.minutes).toBe(1);
      expect(result.words).toBe(0);
      expect(result.displayText).toBe("1 min read");
    });

    it("should handle null or undefined content gracefully", () => {
      const resultNull = calculateReadingTime(null as unknown as string);
      const resultUndefined = calculateReadingTime(
        undefined as unknown as string
      );

      expect(resultNull.minutes).toBe(1);
      expect(resultNull.words).toBe(0);
      expect(resultNull.displayText).toBe("1 min read");

      expect(resultUndefined.minutes).toBe(1);
      expect(resultUndefined.words).toBe(0);
      expect(resultUndefined.displayText).toBe("1 min read");
    });

    it("should use custom words per minute", () => {
      const content = new Array(300).fill("word").join(" ");

      // Default 200 WPM: 300 / 200 = 1.5 => 2 minutes
      const defaultResult = calculateReadingTime(content);
      expect(defaultResult.minutes).toBe(2);

      // Custom 100 WPM: 300 / 100 = 3 minutes
      const customResult = calculateReadingTime(content, 100);
      expect(customResult.minutes).toBe(3);

      // Custom 300 WPM: 300 / 300 = 1 minute
      const fastResult = calculateReadingTime(content, 300);
      expect(fastResult.minutes).toBe(1);
    });

    it("should handle markdown content correctly", () => {
      const markdownContent = `
# Hello World

This is a **bold** text and *italic* text.

- List item 1
- List item 2
- List item 3

\`\`\`
code block
\`\`\`
      `.trim();

      const result = calculateReadingTime(markdownContent);

      // Should count words including markdown syntax
      expect(result.words).toBeGreaterThan(0);
      expect(result.minutes).toBeGreaterThan(0);
    });

    it("should handle HTML content correctly", () => {
      const htmlContent = `
<h1>Hello World</h1>
<p>This is <strong>bold</strong> text and <em>italic</em> text.</p>
<ul>
  <li>List item 1</li>
  <li>List item 2</li>
</ul>
      `.trim();

      const result = calculateReadingTime(htmlContent);

      // HTML tags are counted as separate words
      expect(result.words).toBeGreaterThan(0);
      expect(result.minutes).toBeGreaterThan(0);
    });

    it("should round up partial minutes", () => {
      // 250 words / 200 WPM = 1.25 minutes => rounds up to 2
      const content = new Array(250).fill("word").join(" ");
      const result = calculateReadingTime(content);

      expect(result.minutes).toBe(2);
      expect(result.words).toBe(250);
    });

    it("should always return at least 1 minute", () => {
      const content = "one";
      const result = calculateReadingTime(content);

      expect(result.minutes).toBe(1);
      expect(result.minutes).toBeGreaterThanOrEqual(1);
    });

    it("should correctly pluralize display text", () => {
      // 1 minute
      const oneMinResult = calculateReadingTime("test");
      expect(oneMinResult.displayText).toBe("1 min read");
      expect(oneMinResult.displayText).not.toContain("mins");

      // 2+ minutes
      const multiMinResult = calculateReadingTime(
        new Array(400).fill("word").join(" ")
      );
      expect(multiMinResult.displayText).toContain("min read");
      expect(multiMinResult.displayText).not.toBe("1 min read");
    });

    it("should handle real blog post content", () => {
      const blogContent = `
# The Ultimate Guide to Web Performance

Web performance is critical for user experience and SEO. Users expect pages to load in under 3 seconds,
and every second of delay can reduce conversions by 7%. In this comprehensive guide, we'll explore
the key metrics, techniques, and tools you need to optimize your web applications.

## Core Web Vitals

Core Web Vitals are a set of metrics that Google considers important for overall page health.
These metrics include Largest Contentful Paint (LCP), First Input Delay (FID), and Cumulative Layout Shift (CLS).

### Largest Contentful Paint (LCP)

LCP measures loading performance. To provide a good user experience, LCP should occur within 2.5 seconds
of when the page first starts loading.

### First Input Delay (FID)

FID measures interactivity. To provide a good user experience, pages should have an FID of 100 milliseconds or less.

### Cumulative Layout Shift (CLS)

CLS measures visual stability. To provide a good user experience, pages should maintain a CLS of 0.1 or less.

## Optimization Techniques

1. Minify CSS, JavaScript, and HTML
2. Optimize images and use modern formats
3. Implement lazy loading
4. Use a Content Delivery Network (CDN)
5. Enable compression
6. Reduce server response time
7. Implement caching strategies
8. Use a CDN for static assets
9. Optimize database queries
10. Implement progressive web app features

## Tools and Monitoring

PageSpeed Insights, Lighthouse, WebPageTest, and GTmetrix are excellent tools for monitoring
and analyzing your website's performance. These tools provide detailed insights into your site's performance
and recommendations for improvement.

## Conclusion

Web performance optimization is an ongoing process that requires monitoring, testing, and continuous improvement.
      `.trim();

      const result = calculateReadingTime(blogContent);

      // Should be in realistic range for blog post
      expect(result.minutes).toBeGreaterThanOrEqual(2);
      expect(result.minutes).toBeLessThan(10);
      expect(result.words).toBeGreaterThan(100);
    });
  });

  describe("formatReadingTime", () => {
    it("should format reading time with word count", () => {
      const result = {
        minutes: 5,
        words: 1000,
        displayText: "5 min read",
      };

      const formatted = formatReadingTime(result);

      expect(formatted).toBe("5 min read • 1,000 words");
    });

    it("should format single minute correctly", () => {
      const result = {
        minutes: 1,
        words: 50,
        displayText: "1 min read",
      };

      const formatted = formatReadingTime(result);

      expect(formatted).toBe("1 min read • 50 words");
    });

    it("should localize word count with thousands separator", () => {
      const result = {
        minutes: 10,
        words: 2000,
        displayText: "10 min read",
      };

      const formatted = formatReadingTime(result);

      // Should include thousands separator
      expect(formatted).toContain("2,000");
    });

    it("should handle large word counts", () => {
      const result = {
        minutes: 100,
        words: 20000,
        displayText: "100 min read",
      };

      const formatted = formatReadingTime(result);

      expect(formatted).toBe("100 min read • 20,000 words");
    });

    it("should handle zero words", () => {
      const result = {
        minutes: 1,
        words: 0,
        displayText: "1 min read",
      };

      const formatted = formatReadingTime(result);

      expect(formatted).toBe("1 min read • 0 words");
    });
  });

  describe("getReadingTimeDisplay", () => {
    it("should return display text with word count by default", () => {
      const content = new Array(1000).fill("word").join(" ");
      const display = getReadingTimeDisplay(content);

      expect(display).toContain("min read");
      expect(display).toContain("words");
      expect(display).toContain("•");
    });

    it("should return display text only when includeWordCount is false", () => {
      const content = new Array(1000).fill("word").join(" ");
      const display = getReadingTimeDisplay(content, false);

      expect(display).toContain("min read");
      expect(display).not.toContain("words");
      expect(display).not.toContain("•");
    });

    it("should handle empty content gracefully", () => {
      const display = getReadingTimeDisplay("");

      expect(display).toBe("1 min read • 0 words");
    });

    it("should handle empty content without word count", () => {
      const display = getReadingTimeDisplay("", false);

      expect(display).toBe("1 min read");
    });

    it("should be consistent with separate functions", () => {
      const content = new Array(2000).fill("word").join(" ");

      // Direct calculation
      const result = calculateReadingTime(content);
      const formatted = formatReadingTime(result);

      // Using getReadingTimeDisplay
      const display = getReadingTimeDisplay(content);

      expect(display).toBe(formatted);
    });
  });
});
