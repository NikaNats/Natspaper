/**
 * Unit Tests: PostRepository — visibility & ordering contract
 * ===========================================================
 * Regression coverage for the bug where `PostRepository` only excluded
 * drafts, so scheduled (future-dated) posts leaked onto the home page, post
 * list, archives, RSS/Atom and OG images while the tag pages (which used
 * `postFilter`) hid them.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { CollectionEntry } from "astro:content";
import { createMockBlogPost } from "@tests/helpers/mockBlogPost";

vi.mock("@/config", () => ({
  FEATURES: { scheduledPostMargin: 15 * 60 * 1000 },
}));

const PAST = new Date("2024-01-01T00:00:00Z");
const LATER_PAST = new Date("2024-06-01T00:00:00Z");
const FUTURE = new Date("2099-01-01T00:00:00Z");

const fixtures: CollectionEntry<"blog">[] = [
  createMockBlogPost("en/old", PAST),
  createMockBlogPost("en/newer", LATER_PAST),
  createMockBlogPost("en/scheduled", FUTURE),
  createMockBlogPost("en/draft", LATER_PAST, null, false),
  createMockBlogPost("ka/old", PAST),
];

/**
 * Fresh module graph per test (the repository holds a module-level memo), with
 * the astro:content stub honouring the filter argument like Astro does.
 */
async function loadRepository() {
  vi.resetModules();
  const { getCollection } = await import("astro:content");
  vi.mocked(getCollection).mockImplementation((async (
    _collection: string,
    filter?: (entry: CollectionEntry<"blog">) => unknown
  ) => (filter ? fixtures.filter(filter) : [...fixtures])) as never);
  return (await import("@/utils/post/repository")).PostRepository;
}

describe("PostRepository (production build)", () => {
  beforeEach(() => {
    vi.stubEnv("DEV", false);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("excludes drafts and scheduled posts from getAll", async () => {
    const repo = await loadRepository();
    const ids = (await repo.getAll()).map(p => p.id);

    expect(ids).not.toContain("en/scheduled");
    expect(ids).not.toContain("en/draft");
    expect(ids).toEqual(expect.arrayContaining(["en/old", "en/newer", "ka/old"]));
  });

  it("orders by pubDatetime desc with a deterministic id tie-break", async () => {
    const repo = await loadRepository();
    expect((await repo.getSorted()).map(p => p.id)).toEqual([
      "en/newer",
      "en/old",
      "ka/old",
    ]);
  });

  it("never surfaces a scheduled post through the locale fallback", async () => {
    const repo = await loadRepository();
    const ka = await repo.getByLocaleWithFallback("ka");

    expect(ka.map(p => p.post.id)).toEqual(["en/newer", "ka/old"]);
    expect(ka.find(p => p.post.id === "ka/old")?.isFallback).toBe(false);
    expect(ka.find(p => p.post.id === "en/newer")?.isFallback).toBe(true);
  });

  it("memoizes getByLocaleWithFallback per locale in production", async () => {
    const repo = await loadRepository();
    expect(repo.getByLocaleWithFallback("en")).toBe(
      repo.getByLocaleWithFallback("en")
    );
    expect(repo.getByLocaleWithFallback("en")).not.toBe(
      repo.getByLocaleWithFallback("ka")
    );
  });
});

describe("PostRepository (dev server)", () => {
  beforeEach(() => {
    vi.stubEnv("DEV", true);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows scheduled posts in dev but still hides drafts", async () => {
    const repo = await loadRepository();
    const ids = (await repo.getAll()).map(p => p.id);

    expect(ids).toContain("en/scheduled");
    expect(ids).not.toContain("en/draft");
  });

  it("does not memoize in dev so content edits are picked up", async () => {
    const repo = await loadRepository();
    expect(repo.getByLocaleWithFallback("en")).not.toBe(
      repo.getByLocaleWithFallback("en")
    );
  });
});
