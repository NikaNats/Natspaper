// tests/e2e/criticalPaths.e2e.test.ts

import { describe, it, expect } from "vitest";
import { isSafeUrl } from "@/utils/rss/sanitizeMarkdownUrls";

describe("Security: URL Sanitization", () => {
  it("should reject malicious URI schemes (XSS Prevention)", () => {
    const maliciousUrls = [
      'javascript:alert("XSS")',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      'vbscript:msgbox("XSS")',
      '  javascript:void(0)', // Whitespace bypass attempt
      'JAVASCRIPT:alert(1)'   // Case sensitivity bypass attempt
    ];

    maliciousUrls.forEach(url => {
      const isSafe = isSafeUrl(url);
      expect(isSafe, `URL should be rejected: ${url}`).toBe(false);
    });
  });

  it("should allow safe protocols and relative paths", () => {
    const safeUrls = [
      "https://natspaper.vercel.app/posts/system-design",
      "http://example.com",
      "mailto:nika@example.com",
      "/ka/archives",
      "#table-of-contents"
    ];

    safeUrls.forEach(url => {
      expect(isSafeUrl(url), `URL should be accepted: ${url}`).toBe(true);
    });
  });
});