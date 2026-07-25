/**
 * Unit Tests: generateOgImages — Memory Management & Error Recovery
 * ==================================================================
 * Guards against reintroducing `globalThis.gc()` or `resvg.free()` calls
 * that block the Node.js Event Loop during parallel OG image generation.
 *
 * Also verifies:
 * - Fallback PNG on generation failure (build never crashes)
 * - Resvg N-API finalizer strategy (no manual .free())
 * - Return type correctness
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import type { CollectionEntry } from "astro:content";

// ---------------------------------------------------------------------------
// Mocks — vi.mock calls are hoisted by Vitest before imports.
// ---------------------------------------------------------------------------

const mockFree = vi.fn();
const mockRender = vi.fn(() => ({
  asPng: vi.fn(() => new Uint8Array([0x89, 0x50, 0x4e, 0x47])),
}));

vi.mock("@resvg/resvg-js", () => {
  const MockResvg = vi.fn(() => ({
    render: mockRender,
    free: mockFree,
  }));
  return { Resvg: MockResvg };
});

const mockPostOgImage = vi.fn().mockResolvedValue("<svg></svg>");

vi.mock("@/utils/og/templates/post", () => ({
  default: (...args: unknown[]) => mockPostOgImage(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFakePost(id: string): CollectionEntry<"blog"> {
  return {
    id: `en/${id}.md`,
    slug: `en/${id}`,
    body: "",
    collection: "blog",
    filePath: "",
    data: {
      title: "Test Post",
      description: "Test description",
      pubDatetime: new Date("2025-01-01"),
      modDatetime: null,
      tags: ["test"],
      draft: false,
      author: "Test Author",
      featured: false,
      hideEditPost: false,
    },
  } as CollectionEntry<"blog">;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("generateOgImages — Memory Management & Error Recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPostOgImage.mockResolvedValue("<svg></svg>");
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).gc;
  });

  // ── Removed-function guards (compile-time deletions) ─────────────────

  it("does NOT expose triggerGarbageCollection (function was removed)", async () => {
    const mod = await import("@/utils/og/generateOgImages");
    expect(
      (mod as Record<string, unknown>)["triggerGarbageCollection"]
    ).toBeUndefined();
  });

  it("does NOT expose cleanupResvg (function was removed)", async () => {
    const mod = await import("@/utils/og/generateOgImages");
    expect((mod as Record<string, unknown>)["cleanupResvg"]).toBeUndefined();
  });

  // ── Runtime guard: gc() must never be invoked ────────────────────────

  it("does NOT call globalThis.gc() during image generation", async () => {
    const gcSpy = vi.fn();
    (globalThis as Record<string, unknown>).gc = gcSpy;

    const { generateOgImageForPost } = await import(
      "@/utils/og/generateOgImages"
    );
    await generateOgImageForPost(makeFakePost("gc-test"));

    expect(gcSpy).not.toHaveBeenCalled();
  });

  // ── Runtime guard: resvg.free() must never be invoked ────────────────

  it("does NOT call resvg.free() on any Resvg instance", async () => {
    const { generateOgImageForPost } = await import(
      "@/utils/og/generateOgImages"
    );

    await generateOgImageForPost(makeFakePost("free-check"));

    expect(mockFree).not.toHaveBeenCalled();
  });

  // ── Happy path ───────────────────────────────────────────────────────

  it("generateOgImageForPost returns a valid Uint8Array", async () => {
    const { generateOgImageForPost } = await import(
      "@/utils/og/generateOgImages"
    );
    const result = await generateOgImageForPost(makeFakePost("ok"));

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it("calls postOgImage template with the post object", async () => {
    const { generateOgImageForPost } = await import(
      "@/utils/og/generateOgImages"
    );
    const post = makeFakePost("template-check");

    await generateOgImageForPost(post);

    expect(mockPostOgImage).toHaveBeenCalledWith(post);
  });

  // ── Error recovery: fallback PNG (NEW — critical missing test) ───────

  it("returns fallback PNG when postOgImage throws (font missing)", async () => {
    mockPostOgImage.mockRejectedValueOnce(new Error("Font load failed"));

    const { generateOgImageForPost } = await import(
      "@/utils/og/generateOgImages"
    );
    const result = await generateOgImageForPost(makeFakePost("font-fail"));

    // Must NOT throw — build must survive
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    // Fallback is a 1x1 transparent PNG (67 bytes)
    expect(result.length).toBeLessThan(100);
  });

  it("returns fallback PNG when Resvg render throws", async () => {
    mockRender.mockImplementationOnce(() => {
      throw new Error("Resvg native crash");
    });

    const { generateOgImageForPost } = await import(
      "@/utils/og/generateOgImages"
    );
    const result = await generateOgImageForPost(makeFakePost("resvg-fail"));

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it("does NOT call gc() or free() even on error path", async () => {
    const gcSpy = vi.fn();
    (globalThis as Record<string, unknown>).gc = gcSpy;
    mockPostOgImage.mockRejectedValueOnce(new Error("Satori crash"));

    const { generateOgImageForPost } = await import(
      "@/utils/og/generateOgImages"
    );
    await generateOgImageForPost(makeFakePost("error-gc"));

    expect(gcSpy).not.toHaveBeenCalled();
    expect(mockFree).not.toHaveBeenCalled();
  });

  // ── Concurrency safety ───────────────────────────────────────────────

  it("handles concurrent generation without shared state corruption", async () => {
    const { generateOgImageForPost } = await import(
      "@/utils/og/generateOgImages"
    );

    const posts = Array.from({ length: 5 }, (_, i) =>
      makeFakePost(`concurrent-${i}`)
    );

    const results = await Promise.all(
      posts.map(post => generateOgImageForPost(post))
    );

    expect(results).toHaveLength(5);
    for (const result of results) {
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    }
  });
});