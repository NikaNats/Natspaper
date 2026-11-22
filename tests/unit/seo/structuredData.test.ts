import { describe, it, expect, vi } from "vitest";

vi.mock("@/config", () => ({
  SITE: {
    title: "Test Site",
    author: "Default Author",
    profile: "https://example.com/about",
    desc: "Site description",
  },
}));

import {
  combineSchemas,
  generateBlogPostingSchema,
  generateBreadcrumbSchema,
  generatePersonSchema,
  generateWebSiteSchema,
  getAuthor,
  getPublisher,
} from "@/utils/seo";

const SITE_URL = "https://example.com";

describe("structured data (JSON-LD)", () => {
  describe("getPublisher() / getAuthor()", () => {
    it("builds an Organization publisher with a logo", () => {
      expect(getPublisher(SITE_URL)).toEqual({
        "@type": "Organization",
        name: "Test Site",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/favicon.svg`,
          width: 512,
          height: 512,
        },
      });
    });

    it("defaults the author to the site author and omits an empty url", () => {
      expect(getAuthor()).toEqual({ "@type": "Person", name: "Default Author" });
      expect(getAuthor("A", "https://a.dev")).toEqual({
        "@type": "Person",
        name: "A",
        url: "https://a.dev",
      });
    });
  });

  describe("generateBlogPostingSchema()", () => {
    const base = {
      title: "Post",
      description: "Desc",
      imageUrl: `${SITE_URL}/og.png`,
      datePublished: new Date("2026-01-01T00:00:00Z"),
      pageUrl: `${SITE_URL}/en/posts/post`,
      siteUrl: SITE_URL,
    };

    it("emits required fields and omits optional ones when absent", () => {
      const schema = generateBlogPostingSchema(base);
      expect(schema).toMatchObject({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: "Post",
        datePublished: "2026-01-01T00:00:00.000Z",
        mainEntityOfPage: { "@type": "WebPage", "@id": base.pageUrl },
        inLanguage: "en",
        author: {
          "@type": "Person",
          name: "Default Author",
          url: "https://example.com/about",
        },
      });
      expect(schema).not.toHaveProperty("dateModified");
      expect(schema).not.toHaveProperty("wordCount");
      expect(schema).not.toHaveProperty("keywords");
    });

    it("includes optional fields when provided", () => {
      const schema = generateBlogPostingSchema({
        ...base,
        dateModified: new Date("2026-02-01T00:00:00Z"),
        wordCount: 1200,
        tags: ["a", "b"],
        locale: "ka-GE",
        authorName: "Someone",
      });
      expect(schema.dateModified).toBe("2026-02-01T00:00:00.000Z");
      expect(schema.wordCount).toBe(1200);
      expect(schema.keywords).toBe("a, b");
      expect(schema.inLanguage).toBe("ka-GE");
      expect(schema.author).toMatchObject({ name: "Someone" });
    });

    it("truncates long headlines (110) and descriptions (160)", () => {
      const schema = generateBlogPostingSchema({
        ...base,
        title: "x".repeat(200),
        description: "y".repeat(300),
      });
      expect(schema.headline).toHaveLength(110);
      expect(schema.headline.endsWith("...")).toBe(true);
      expect(schema.description).toHaveLength(160);
    });

    it("treats an empty tag list and a null modified date as absent", () => {
      const schema = generateBlogPostingSchema({
        ...base,
        tags: [],
        dateModified: null,
      });
      expect(schema).not.toHaveProperty("keywords");
      expect(schema).not.toHaveProperty("dateModified");
    });
  });

  describe("generateBreadcrumbSchema()", () => {
    it("numbers items from 1 and omits the url of the current page", () => {
      expect(
        generateBreadcrumbSchema([
          { name: "Home", url: `${SITE_URL}/en/` },
          { name: "Post" },
        ]).itemListElement
      ).toEqual([
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
        { "@type": "ListItem", position: 2, name: "Post" },
      ]);
    });
  });

  describe("generatePersonSchema()", () => {
    it("emits only the provided fields", () => {
      expect(generatePersonSchema({ name: "N" })).toEqual({
        "@context": "https://schema.org",
        "@type": "Person",
        name: "N",
      });
    });

    it("maps every optional field", () => {
      expect(
        generatePersonSchema({
          name: "N",
          url: "https://n.dev",
          imageUrl: "https://n.dev/me.jpg",
          jobTitle: "Engineer",
          description: "Bio",
          socialLinks: ["https://github.com/n"],
          employer: { name: "Co", url: "https://co.dev" },
        })
      ).toMatchObject({
        url: "https://n.dev",
        image: "https://n.dev/me.jpg",
        jobTitle: "Engineer",
        description: "Bio",
        sameAs: ["https://github.com/n"],
        worksFor: { "@type": "Organization", name: "Co", url: "https://co.dev" },
      });
    });

    it("omits empty social links and an employer url", () => {
      const schema = generatePersonSchema({
        name: "N",
        socialLinks: [],
        employer: { name: "Co" },
      });
      expect(schema).not.toHaveProperty("sameAs");
      expect(schema.worksFor).toEqual({ "@type": "Organization", name: "Co" });
    });
  });

  describe("generateWebSiteSchema()", () => {
    it("describes the site with author and publisher", () => {
      expect(generateWebSiteSchema({ siteUrl: SITE_URL, locale: "ka-GE" })).toMatchObject({
        "@type": "WebSite",
        name: "Test Site",
        url: SITE_URL,
        description: "Site description",
        inLanguage: "ka-GE",
        author: { name: "Default Author" },
        publisher: { name: "Test Site" },
      });
      expect(generateWebSiteSchema({ siteUrl: SITE_URL }).inLanguage).toBe("en");
    });
  });

  describe("combineSchemas()", () => {
    it("merges schemas into one @graph with a single top-level @context", () => {
      const graph = combineSchemas(
        generateBreadcrumbSchema([{ name: "Home" }]),
        generateWebSiteSchema({ siteUrl: SITE_URL })
      );
      expect(graph["@context"]).toBe("https://schema.org");
      const nodes = graph["@graph"] as Array<Record<string, unknown>>;
      expect(nodes).toHaveLength(2);
      for (const node of nodes) expect(node).not.toHaveProperty("@context");
    });
  });
});
