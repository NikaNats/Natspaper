import { describe, it, expect } from "vitest";

/**
 * Validates robots.txt against RFC 9309 grammar rules:
 * - Product-token contains only valid characters ([a-zA-Z0-9_-]+)
 * - Directives start with Allow: or Disallow:
 * - Empty line terminates groups
 * - Sitemap line uses absolute URI
 */
function parseAndValidateRobotsTxt(content: string) {
  const lines = content.split(/\r?\n/);
  const errors: string[] = [];

  let inGroup = false;
  let hasUserAgent = false;
  let hasSitemap = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!;
    const line = rawLine.replace(/#.*$/, "").trim(); // Strip comments and whitespace

    if (!line) {
      if (inGroup && hasUserAgent) {
        inGroup = false;
        hasUserAgent = false;
      }
      continue;
    }

    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      errors.push(`Line ${i + 1}: Missing colon delimiter in "${line}"`);
      continue;
    }

    const field = line.slice(0, colonIndex).trim().toLowerCase();
    const value = line.slice(colonIndex + 1).trim();

    if (field === "user-agent") {
      inGroup = true;
      hasUserAgent = true;
      if (!/^[a-zA-Z0-9_\-*]+$/.test(value)) {
        errors.push(`Line ${i + 1}: Invalid product token "${value}" (RFC 9309 Section 2.2.1)`);
      }
    } else if (field === "allow" || field === "disallow") {
      if (!inGroup || !hasUserAgent) {
        errors.push(`Line ${i + 1}: Directive "${field}" must follow a User-agent line`);
      }
      if (value && !value.startsWith("/")) {
        errors.push(`Line ${i + 1}: Path "${value}" must start with "/" (RFC 9309 Section 2.2.2)`);
      }
    } else if (field === "sitemap") {
      hasSitemap = true;
      if (!/^https?:\/\/.+/i.test(value)) {
        errors.push(`Line ${i + 1}: Sitemap must be an absolute URL "${value}" (RFC 9309 Section 2.2.4)`);
      }
    }
  }

  return { errors, hasSitemap };
}

describe("RFC 9309: Robots Exclusion Protocol Validator", () => {
  it("should validate a compliant RFC 9309 robots.txt structure", () => {
    const sampleRobots = `
# RFC 9309 Sample
User-agent: *
Allow: /
Disallow: /api/

User-agent: Googlebot
Allow: /en/
Disallow: /private/

Sitemap: https://natspaper.vercel.app/sitemap-index.xml
    `.trim();

    const { errors, hasSitemap } = parseAndValidateRobotsTxt(sampleRobots);
    expect(errors).toEqual([]);
    expect(hasSitemap).toBe(true);
  });

  it("should detect invalid product tokens violating RFC 9309 Section 2.2.1", () => {
    const invalidRobots = `
User-agent: Invalid@Token!
Disallow: /
    `.trim();

    const { errors } = parseAndValidateRobotsTxt(invalidRobots);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("Invalid product token");
  });

  it("should detect orphaned allow/disallow directives outside a group", () => {
    const orphanedRobots = `
Disallow: /api/
User-agent: *
Allow: /
    `.trim();

    const { errors } = parseAndValidateRobotsTxt(orphanedRobots);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("must follow a User-agent line");
  });
});
