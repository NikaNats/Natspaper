// tests/unit/core/webLinking.test.ts
import { describe, it, expect } from "vitest";
import {
  serializeLinkHeader,
  parseLinkHeader,
  type WebLink,
} from "@/utils/core/webLinking";

describe("RFC 8288: Web Linking Protocol", () => {
  describe("serializeLinkHeader()", () => {
    it("should serialize a canonical and alternate relation according to RFC 8288", () => {
      const links: WebLink[] = [
        { target: "https://natspaper.vercel.app/en/", rel: "canonical" },
        { target: "https://natspaper.vercel.app/ka/", rel: "alternate", hreflang: "ka-GE" },
      ];

      const serialized = serializeLinkHeader(links);
      expect(serialized).toBe(
        '<https://natspaper.vercel.app/en/>; rel="canonical", <https://natspaper.vercel.app/ka/>; rel="alternate"; hreflang="ka-GE"'
      );
    });

    it("should serialize preload font hints with attributes", () => {
      const links: WebLink[] = [
        {
          target: "/fonts/inter.woff2",
          rel: "preload",
          as: "font",
          type: "font/woff2",
          crossorigin: true,
        },
      ];

      const serialized = serializeLinkHeader(links);
      expect(serialized).toBe(
        '</fonts/inter.woff2>; rel="preload"; type="font/woff2"; as="font"; crossorigin'
      );
    });

    it("should return empty string for empty link lists", () => {
      expect(serializeLinkHeader([])).toBe("");
    });
  });

  describe("parseLinkHeader()", () => {
    it("should parse multiple link entries and parameters", () => {
      const rawHeader =
        '</en/posts?page=1>; rel="prev", </en/posts?page=3>; rel="next"; title="Next Page", </fonts/inter.woff>; rel="preload"; as="font"';

      const parsed = parseLinkHeader(rawHeader);
      expect(parsed).toHaveLength(3);

      expect(parsed[0]).toEqual({
        target: "/en/posts?page=1",
        rel: "prev",
      });

      expect(parsed[1]).toEqual({
        target: "/en/posts?page=3",
        rel: "next",
        title: "Next Page",
      });

      expect(parsed[2]).toEqual({
        target: "/fonts/inter.woff",
        rel: "preload",
        as: "font",
      });
    });

    it("should handle empty or malformed strings gracefully", () => {
      expect(parseLinkHeader("")).toEqual([]);
      expect(parseLinkHeader("invalid-link-without-brackets")).toEqual([]);
    });
  });
});
