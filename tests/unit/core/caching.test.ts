// tests/unit/core/caching.test.ts
import { describe, it, expect } from "vitest";

const VALID_RFC9111_DIRECTIVES = new Set([
  "max-age",
  "max-stale",
  "min-fresh",
  "must-revalidate",
  "must-understand",
  "no-cache",
  "no-store",
  "no-transform",
  "only-if-cached",
  "private",
  "proxy-revalidate",
  "public",
  "s-maxage",
  "immutable",
  "stale-while-revalidate",
  "stale-if-error",
]);

function validateCacheControlHeader(headerValue: string): string[] {
  const errors: string[] = [];
  const directives = headerValue.split(",").map(d => d.trim());

  for (const directive of directives) {
    const [name, val] = directive.split("=");
    const cleanName = name?.trim().toLowerCase() || "";

    if (!VALID_RFC9111_DIRECTIVES.has(cleanName)) {
      errors.push(`Unrecognized RFC 9111 directive: "${cleanName}"`);
    }

    if (val !== undefined) {
      if (cleanName === "max-age" || cleanName === "s-maxage" || cleanName === "stale-while-revalidate") {
        if (!/^\d+$/.test(val.trim())) {
          errors.push(`Directive "${cleanName}" must have integer delta-seconds value, got: "${val}"`);
        }
      }
    }
  }

  return errors;
}

describe("RFC 9111: HTTP Caching Header Validation", () => {
  it("should validate Tier 1 Immutable Static Asset caching", () => {
    const tier1 = "public, max-age=31536000, immutable";
    const errors = validateCacheControlHeader(tier1);
    expect(errors).toEqual([]);
  });

  it("should validate Tier 2 HTML Document edge caching with must-revalidate", () => {
    const tier2 = "public, max-age=0, must-revalidate, s-maxage=86400, stale-while-revalidate=3600";
    const errors = validateCacheControlHeader(tier2);
    expect(errors).toEqual([]);
  });

  it("should validate Tier 4 Health monitoring cache with no-transform", () => {
    const tier4 = "public, max-age=60, s-maxage=60, no-transform";
    const errors = validateCacheControlHeader(tier4);
    expect(errors).toEqual([]);
  });

  it("should flag invalid directives or non-integer delta seconds", () => {
    const invalidHeader = "public, max-age=invalid_time, unknown-directive";
    const errors = validateCacheControlHeader(invalidHeader);
    expect(errors.length).toBe(2);
  });
});
