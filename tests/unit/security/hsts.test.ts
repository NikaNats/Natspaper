// tests/unit/security/hsts.test.ts
import { describe, it, expect } from "vitest";

interface HSTSValidationResult {
  isValid: boolean;
  maxAge: number;
  includeSubDomains: boolean;
  preload: boolean;
  errors: string[];
}

function parseAndValidateHSTS(headerValue: string): HSTSValidationResult {
  const result: HSTSValidationResult = {
    isValid: true,
    maxAge: 0,
    includeSubDomains: false,
    preload: false,
    errors: [],
  };

  if (!headerValue || typeof headerValue !== "string") {
    result.isValid = false;
    result.errors.push("HSTS header value cannot be empty");
    return result;
  }

  const directives = headerValue.split(";").map(d => d.trim());
  let maxAgeFound = false;

  for (const directive of directives) {
    const [name, val] = directive.split("=");
    const cleanName = name?.trim().toLowerCase();

    if (cleanName === "max-age") {
      maxAgeFound = true;
      if (!val || !/^\d+$/.test(val.trim().replace(/^"|"$/g, ""))) {
        result.errors.push(`Invalid max-age value: "${val}"`);
        result.isValid = false;
      } else {
        result.maxAge = parseInt(val.trim().replace(/^"|"$/g, ""), 10);
      }
    } else if (cleanName === "includesubdomains") {
      result.includeSubDomains = true;
    } else if (cleanName === "preload") {
      result.preload = true;
    }
  }

  if (!maxAgeFound) {
    result.isValid = false;
    result.errors.push("Missing REQUIRED max-age directive (RFC 6797 Section 6.1.1)");
  }

  return result;
}

describe("RFC 6797: HTTP Strict Transport Security Validator", () => {
  it("should validate canonical production HSTS header", () => {
    const header = "max-age=63072000; includeSubDomains; preload";
    const result = parseAndValidateHSTS(header);

    expect(result.isValid).toBe(true);
    expect(result.maxAge).toBe(63072000);
    expect(result.includeSubDomains).toBe(true);
    expect(result.preload).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should validate quoted max-age strings (RFC 6797 Section 6.2)", () => {
    const header = 'max-age="31536000"; includeSubDomains';
    const result = parseAndValidateHSTS(header);

    expect(result.isValid).toBe(true);
    expect(result.maxAge).toBe(31536000);
    expect(result.includeSubDomains).toBe(true);
  });

  it("should reject headers missing the required max-age directive", () => {
    const header = "includeSubDomains; preload";
    const result = parseAndValidateHSTS(header);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing REQUIRED max-age directive (RFC 6797 Section 6.1.1)");
  });

  it("should reject non-integer max-age values", () => {
    const header = "max-age=one_year; includeSubDomains";
    const result = parseAndValidateHSTS(header);

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Invalid max-age value");
  });
});
