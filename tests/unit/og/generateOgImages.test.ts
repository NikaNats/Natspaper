/**
 * Unit Tests: generateOgImages — Memory Management
 * =================================================
 * Guards against reintroducing `globalThis.gc()` or `resvg.free()` calls that
 * block the Node.js Event Loop during parallel OG image generation.
 */

import { describe, it, expect, vi, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — vi.mock calls are hoisted by Vitest before imports.
// astro:content is already aliased to a stub in vitest.config.ts.
// ---------------------------------------------------------------------------

// Minimal Resvg mock: simulates the N-API render pipeline without native code.
vi.mock("@resvg/resvg-js", () => {
  const fakePngData = {
    asPng: vi.fn(() => new Uint8Array([0x89, 0x50, 0x4e, 0x47])),
  };
  const MockResvg = vi.fn(() => ({
    render: vi.fn(() => fakePngData),
    // free() presence here lets us assert it is NEVER called
    free: vi.fn(),
  }));
  return { Resvg: MockResvg };
});

vi.mock("@/utils/og/templates/post", () => ({
  default: vi.fn().mockResolvedValue("<svg></svg>"),
}));

describe("generateOgImages — GC / free() regression guards", () => {
  // Import the module once — mocks are already hoisted by vi.mock() above
  // so all transitive deps (Resvg, astro:content) use fakes.

  afterEach(() => {
    // @ts-expect-error clean up any gc spy
    delete globalThis.gc;
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Removed-function guards (compile-time deletions)
  // -------------------------------------------------------------------------
  it("does NOT expose triggerGarbageCollection (function was removed)", async () => {
    const mod = await import("@/utils/og/generateOgImages");
    expect((mod as Record<string, unknown>)["triggerGarbageCollection"]).toBeUndefined();
  });

  it("does NOT expose cleanupResvg (function was removed)", async () => {
    const mod = await import("@/utils/og/generateOgImages");
    expect((mod as Record<string, unknown>)["cleanupResvg"]).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Runtime guard: gc() must never be invoked
  // -------------------------------------------------------------------------
  it("does NOT call globalThis.gc() during image generation", async () => {
    const gcSpy = vi.fn();
    // @ts-expect-error write gc on global
    globalThis.gc = gcSpy;

    const { generateOgImageForPost } = await import("@/utils/og/generateOgImages");
    await generateOgImageForPost(makeFakePost("gc-test"));

    expect(gcSpy).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Runtime guard: resvg.free() must never be invoked
  // -------------------------------------------------------------------------
  it("does NOT call resvg.free() on any Resvg instance", async () => {
    const { Resvg } = await import("@resvg/resvg-js");
    const { generateOgImageForPost } = await import("@/utils/og/generateOgImages");

    await generateOgImageForPost(makeFakePost("free-check"));

    const instances = vi.mocked(Resvg).mock.results
      .filter(r => r.type === "return")
      .map(r => r.value);

    for (const instance of instances) {
      expect(instance.free).not.toHaveBeenCalled();
    }
  });

  // -------------------------------------------------------------------------
  // Happy path: function returns a valid Uint8Array
  // -------------------------------------------------------------------------
  it("generateOgImageForPost returns a Uint8Array", async () => {
    const { generateOgImageForPost } = await import("@/utils/og/generateOgImages");
    const result = await generateOgImageForPost(makeFakePost("ok"));

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeFakePost(id: string): any {
  return {
    id: `en/${id}.md`,
    slug: `en/${id}`,
    body: "",
    collection: "blog",
    filePath: "",
    data: {
      title: "T", description: "d", pubDatetime: new Date(),
      tags: [], draft: false, author: "A", featured: false,
    },
  };
}