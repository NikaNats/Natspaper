import { describe, it, expect } from "vitest";
import { slugifyStr, slugifyAll } from "@/utils/core";

describe("slugify", () => {
  describe("slugifyStr", () => {
    it("should convert to kebab-case", () => {
      expect(slugifyStr("Hello World")).toBe("hello-world");
    });

    it("should handle single words", () => {
      expect(slugifyStr("hello")).toBe("hello");
    });

    it("should handle mixed case", () => {
      expect(slugifyStr("HelloWorld")).toBe("hello-world");
      expect(slugifyStr("HELLO_WORLD")).toBe("hello-world");
    });

    it("should handle special characters", () => {
      expect(slugifyStr("Hello-World!")).toBe("hello-world");
      expect(slugifyStr("Test@#$%")).toBe("test");
    });

    it("should handle multiple spaces", () => {
      expect(slugifyStr("Hello   World")).toBe("hello-world");
    });

    it("should handle underscores", () => {
      expect(slugifyStr("Hello_World")).toBe("hello-world");
    });

    it("should handle leading/trailing spaces", () => {
      expect(slugifyStr("  Hello World  ")).toBe("hello-world");
    });

    it("should handle empty string", () => {
      expect(slugifyStr("")).toBe("");
    });

    it("should handle numbers", () => {
      expect(slugifyStr("Test 123 Post")).toBe("test-123-post");
      expect(slugifyStr("Web3 Development")).toBe("web-3-development");
    });

    it("should handle real blog titles", () => {
      expect(slugifyStr("Getting Started with Astro")).toBe("getting-started-with-astro");
      expect(slugifyStr("Best Practices for React Hooks"))
        .toBe("best-practices-for-react-hooks");
      expect(slugifyStr("SEO Tips & Tricks for 2024"))
        .toBe("seo-tips-tricks-for-2024");
    });

    it("should be idempotent", () => {
      const str = "Hello World";
      const first = slugifyStr(str);
      const second = slugifyStr(first);
      expect(first).toBe(second);
    });
  });

  describe("slugifyAll", () => {
    it("should slugify array of strings", () => {
      const result = slugifyAll(["Hello World", "Test Post"]);
      expect(result).toEqual(["hello-world", "test-post"]);
    });

    it("should handle empty array", () => {
      expect(slugifyAll([])).toEqual([]);
    });

    it("should handle single-element array", () => {
      expect(slugifyAll(["Hello World"])).toEqual(["hello-world"]);
    });

    it("should handle mixed case strings", () => {
      const result = slugifyAll(["UPPERCASE", "lowercase", "MixedCase"]);
      expect(result).toEqual(["uppercase", "lowercase", "mixed-case"]);
    });

    it("should preserve order", () => {
      const input = ["Zebra", "Apple", "Banana"];
      const result = slugifyAll(input);
      expect(result[0]).toBe("zebra");
      expect(result[1]).toBe("apple");
      expect(result[2]).toBe("banana");
    });

    it("should handle special characters in multiple strings", () => {
      const result = slugifyAll(["Hello-World!", "Test@Tag", "Special#Char"]);
      expect(result[0]).toBe("hello-world");
      expect(result[1]).toContain("test");
      expect(result[2]).toContain("special");
    });

    it("should handle tags", () => {
      const tags = ["TypeScript", "Web Development", "Node.js", "React.js"];
      const result = slugifyAll(tags);
      expect(result).toEqual([
        "type-script",
        "web-development",
        "node-js",
        "react-js",
      ]);
    });
  });
});
