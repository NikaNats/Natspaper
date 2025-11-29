/**
 * Unit Tests for Pagination Logic
 *
 * Tests cover:
 * - Pagination URL generation
 * - Edge cases (first page, last page, single page)
 * - Page number calculations
 *
 * Note: This tests the pagination logic, not the Astro component rendering.
 * Component integration tests would be handled separately with Astro Container API.
 *
 * @module tests/unit/ui/pagination.test
 */

import { describe, it, expect } from "vitest";

/**
 * Pagination helper functions that mirror the logic used in Pagination.astro
 * These are pure functions that can be tested in isolation.
 */

interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

/**
 * Generate URL for a specific page number
 */
function getPageUrl(basePath: string, page: number): string {
  if (page === 1) {
    return basePath.replace(/\/+$/, "") || "/";
  }
  return `${basePath.replace(/\/+$/, "")}/${page}`;
}

/**
 * Calculate previous page URL
 */
function getPrevUrl(config: PaginationConfig): string | undefined {
  const { currentPage, totalPages, basePath } = config;
  if (currentPage <= 1 || totalPages <= 1) {
    return undefined;
  }
  return getPageUrl(basePath, currentPage - 1);
}

/**
 * Calculate next page URL
 */
function getNextUrl(config: PaginationConfig): string | undefined {
  const { currentPage, totalPages, basePath } = config;
  if (currentPage >= totalPages || totalPages <= 1) {
    return undefined;
  }
  return getPageUrl(basePath, currentPage + 1);
}

/**
 * Calculate pagination range for display
 * Returns an array of page numbers to display
 */
function getPaginationRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | "ellipsis")[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const result: (number | "ellipsis")[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  let start = Math.max(1, currentPage - halfVisible);
  let end = Math.min(totalPages, currentPage + halfVisible);

  // Adjust if we're near the beginning or end
  if (currentPage <= halfVisible) {
    end = Math.min(totalPages, maxVisible);
  } else if (currentPage > totalPages - halfVisible) {
    start = Math.max(1, totalPages - maxVisible + 1);
  }

  // Add first page and ellipsis if needed
  if (start > 1) {
    result.push(1);
    if (start > 2) {
      result.push("ellipsis");
    }
  }

  // Add visible page numbers
  for (let i = start; i <= end; i++) {
    if (!result.includes(i)) {
      result.push(i);
    }
  }

  // Add ellipsis and last page if needed
  if (end < totalPages) {
    if (end < totalPages - 1) {
      result.push("ellipsis");
    }
    result.push(totalPages);
  }

  return result;
}

/**
 * Validate pagination props
 */
function validatePaginationProps(config: PaginationConfig): string[] {
  const errors: string[] = [];

  if (config.currentPage < 1) {
    errors.push("Current page must be at least 1");
  }

  if (config.totalPages < 1) {
    errors.push("Total pages must be at least 1");
  }

  if (config.currentPage > config.totalPages) {
    errors.push("Current page cannot exceed total pages");
  }

  if (!config.basePath || config.basePath.trim() === "") {
    errors.push("Base path is required");
  }

  return errors;
}

describe("Pagination Logic", () => {
  describe("getPageUrl()", () => {
    it("should return base path for page 1", () => {
      expect(getPageUrl("/en/posts", 1)).toBe("/en/posts");
    });

    it("should append page number for page > 1", () => {
      expect(getPageUrl("/en/posts", 2)).toBe("/en/posts/2");
      expect(getPageUrl("/en/posts", 10)).toBe("/en/posts/10");
    });

    it("should handle trailing slash in base path", () => {
      expect(getPageUrl("/en/posts/", 1)).toBe("/en/posts");
      expect(getPageUrl("/en/posts/", 2)).toBe("/en/posts/2");
    });

    it("should handle root path", () => {
      expect(getPageUrl("/", 1)).toBe("/");
      expect(getPageUrl("/", 2)).toBe("/2");
    });

    it("should handle empty base path", () => {
      expect(getPageUrl("", 1)).toBe("/");
    });
  });

  describe("getPrevUrl()", () => {
    const basePath = "/en/posts";

    it("should return undefined for first page", () => {
      expect(
        getPrevUrl({ currentPage: 1, totalPages: 5, basePath })
      ).toBeUndefined();
    });

    it("should return undefined for single page", () => {
      expect(
        getPrevUrl({ currentPage: 1, totalPages: 1, basePath })
      ).toBeUndefined();
    });

    it("should return base path when on page 2", () => {
      expect(getPrevUrl({ currentPage: 2, totalPages: 5, basePath })).toBe(
        "/en/posts"
      );
    });

    it("should return correct URL for page 3+", () => {
      expect(getPrevUrl({ currentPage: 3, totalPages: 5, basePath })).toBe(
        "/en/posts/2"
      );
      expect(getPrevUrl({ currentPage: 5, totalPages: 5, basePath })).toBe(
        "/en/posts/4"
      );
    });
  });

  describe("getNextUrl()", () => {
    const basePath = "/en/posts";

    it("should return undefined for last page", () => {
      expect(
        getNextUrl({ currentPage: 5, totalPages: 5, basePath })
      ).toBeUndefined();
    });

    it("should return undefined for single page", () => {
      expect(
        getNextUrl({ currentPage: 1, totalPages: 1, basePath })
      ).toBeUndefined();
    });

    it("should return correct URL for middle pages", () => {
      expect(getNextUrl({ currentPage: 1, totalPages: 5, basePath })).toBe(
        "/en/posts/2"
      );
      expect(getNextUrl({ currentPage: 3, totalPages: 5, basePath })).toBe(
        "/en/posts/4"
      );
    });

    it("should return last page URL when on second-to-last page", () => {
      expect(getNextUrl({ currentPage: 4, totalPages: 5, basePath })).toBe(
        "/en/posts/5"
      );
    });
  });

  describe("getPaginationRange()", () => {
    it("should return all pages when total <= maxVisible", () => {
      expect(getPaginationRange(1, 3, 5)).toEqual([1, 2, 3]);
      expect(getPaginationRange(2, 5, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it("should include ellipsis for many pages", () => {
      const result = getPaginationRange(5, 10, 5);
      expect(result).toContain("ellipsis");
      expect(result).toContain(1);
      expect(result).toContain(10);
    });

    it("should center current page in range", () => {
      const result = getPaginationRange(5, 10, 5);
      expect(result).toContain(5);
      // Should have pages around 5
      expect(result.filter(x => typeof x === "number")).toContain(4);
      expect(result.filter(x => typeof x === "number")).toContain(6);
    });

    it("should handle first page correctly", () => {
      const result = getPaginationRange(1, 10, 5);
      expect(result[0]).toBe(1);
      expect(result).toContain(2);
      expect(result).toContain(3);
    });

    it("should handle last page correctly", () => {
      const result = getPaginationRange(10, 10, 5);
      expect(result[result.length - 1]).toBe(10);
      expect(result).toContain(9);
      expect(result).toContain(8);
    });

    it("should not duplicate page numbers", () => {
      const result = getPaginationRange(3, 10, 5);
      const numbers = result.filter((x): x is number => typeof x === "number");
      const uniqueNumbers = [...new Set(numbers)];
      expect(numbers.length).toBe(uniqueNumbers.length);
    });

    it("should handle single page", () => {
      expect(getPaginationRange(1, 1, 5)).toEqual([1]);
    });

    it("should handle two pages", () => {
      expect(getPaginationRange(1, 2, 5)).toEqual([1, 2]);
      expect(getPaginationRange(2, 2, 5)).toEqual([1, 2]);
    });
  });

  describe("validatePaginationProps()", () => {
    it("should return no errors for valid config", () => {
      const errors = validatePaginationProps({
        currentPage: 2,
        totalPages: 5,
        basePath: "/en/posts",
      });
      expect(errors).toHaveLength(0);
    });

    it("should error for currentPage < 1", () => {
      const errors = validatePaginationProps({
        currentPage: 0,
        totalPages: 5,
        basePath: "/en/posts",
      });
      expect(errors).toContain("Current page must be at least 1");
    });

    it("should error for totalPages < 1", () => {
      const errors = validatePaginationProps({
        currentPage: 1,
        totalPages: 0,
        basePath: "/en/posts",
      });
      expect(errors).toContain("Total pages must be at least 1");
    });

    it("should error for currentPage > totalPages", () => {
      const errors = validatePaginationProps({
        currentPage: 6,
        totalPages: 5,
        basePath: "/en/posts",
      });
      expect(errors).toContain("Current page cannot exceed total pages");
    });

    it("should error for empty basePath", () => {
      const errors = validatePaginationProps({
        currentPage: 1,
        totalPages: 5,
        basePath: "",
      });
      expect(errors).toContain("Base path is required");
    });

    it("should error for whitespace basePath", () => {
      const errors = validatePaginationProps({
        currentPage: 1,
        totalPages: 5,
        basePath: "   ",
      });
      expect(errors).toContain("Base path is required");
    });

    it("should return multiple errors when applicable", () => {
      const errors = validatePaginationProps({
        currentPage: 0,
        totalPages: 0,
        basePath: "",
      });
      expect(errors.length).toBeGreaterThan(1);
    });
  });

  describe("Edge cases", () => {
    it("should handle very large page numbers", () => {
      const basePath = "/posts";
      expect(getPageUrl(basePath, 99999)).toBe("/posts/99999");
      expect(
        getNextUrl({ currentPage: 99998, totalPages: 99999, basePath })
      ).toBe("/posts/99999");
    });

    it("should handle localized paths", () => {
      expect(getPageUrl("/ka/პოსტები", 2)).toBe("/ka/პოსტები/2");
    });

    it("should handle paths with special characters", () => {
      expect(getPageUrl("/en/posts-archive", 2)).toBe("/en/posts-archive/2");
    });
  });

  describe("Integration scenarios", () => {
    it("should generate correct navigation for a 10-page blog", () => {
      const basePath = "/en/posts";

      // Page 1
      expect(getPrevUrl({ currentPage: 1, totalPages: 10, basePath })).toBe(
        undefined
      );
      expect(getNextUrl({ currentPage: 1, totalPages: 10, basePath })).toBe(
        "/en/posts/2"
      );

      // Page 5 (middle)
      expect(getPrevUrl({ currentPage: 5, totalPages: 10, basePath })).toBe(
        "/en/posts/4"
      );
      expect(getNextUrl({ currentPage: 5, totalPages: 10, basePath })).toBe(
        "/en/posts/6"
      );

      // Page 10 (last)
      expect(getPrevUrl({ currentPage: 10, totalPages: 10, basePath })).toBe(
        "/en/posts/9"
      );
      expect(getNextUrl({ currentPage: 10, totalPages: 10, basePath })).toBe(
        undefined
      );
    });

    it("should work correctly for tag pages", () => {
      const basePath = "/en/tags/typescript";

      expect(
        getNextUrl({ currentPage: 1, totalPages: 3, basePath })
      ).toBe("/en/tags/typescript/2");
      expect(
        getPrevUrl({ currentPage: 2, totalPages: 3, basePath })
      ).toBe("/en/tags/typescript");
    });
  });
});
