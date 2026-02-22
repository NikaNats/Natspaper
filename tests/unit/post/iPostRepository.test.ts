/**
 * Unit Tests: IPostRepository — Interface Conformance
 * ====================================================
 * Verifies that:
 * 1. `PostRepository` (MarkdownPostRepository) satisfies `IPostRepository`
 *    at the TypeScript level (compile-time) and at runtime (all methods exist).
 * 2. `MarkdownPostRepository` is the same object as `PostRepository`.
 * 3. A hand-written `FakePostRepository` can satisfy the interface —
 *    proving the interface enables proper Dependency Injection in tests.
 */

import { describe, it, expect } from "vitest";
import type { IPostRepository } from "@/utils/post/IPostRepository";

// Note: astro:content is aliased to a test stub via vitest.config.ts
import { PostRepository, MarkdownPostRepository } from "@/utils/post/repository";

// ---------------------------------------------------------------------------
// Type-level assertion helper (evaluated at compile time by tsc)
// ---------------------------------------------------------------------------
function assertImplements<TInterface>(_value: TInterface): void {
  // This function body is intentionally empty.
  // The generic constraint `_value: TInterface` causes a TS compile error
  // if the argument does not satisfy the interface.
}

describe("IPostRepository — interface conformance", () => {
  // -------------------------------------------------------------------------
  // 1. Compile-time check: PostRepository satisfies IPostRepository
  // -------------------------------------------------------------------------
  it("PostRepository satisfies IPostRepository at compile time", () => {
    // If this line compiles without error, the contract is met.
    assertImplements<IPostRepository>(PostRepository);
    expect(true).toBe(true); // keep test runner happy
  });

  // -------------------------------------------------------------------------
  // 2. Runtime check: every method defined in the interface exists
  // -------------------------------------------------------------------------
  const CONTRACT_METHODS: Array<keyof IPostRepository> = [
    "getAll",
    "getSorted",
    "getByLocale",
    "getByLocaleWithFallback",
    "hasTranslation",
    "getTranslations",
    "getByTag",
    "getFeatured",
    "getSeries",
  ];

  for (const method of CONTRACT_METHODS) {
    it(`PostRepository has method "${method}"`, () => {
      expect(typeof PostRepository[method]).toBe("function");
    });
  }

  // -------------------------------------------------------------------------
  // 3. MarkdownPostRepository is the same reference as PostRepository
  // -------------------------------------------------------------------------
  it("MarkdownPostRepository === PostRepository (same object reference)", () => {
    expect(MarkdownPostRepository).toBe(PostRepository);
  });

  // -------------------------------------------------------------------------
  // 4. A FakePostRepository can satisfy IPostRepository (DIP proof)
  //    — shows that consumers can inject a test double without touching
  //      production code.
  // -------------------------------------------------------------------------
  it("a FakePostRepository can satisfy IPostRepository without real Astro deps", () => {
    const fake: IPostRepository = {
      getAll: async () => [],
      getSorted: async () => [],
      getByLocale: async () => [],
      getByLocaleWithFallback: async () => [],
      hasTranslation: async () => false,
      getTranslations: async () => new Map(),
      getByTag: async () => [],
      getFeatured: async () => [],
      getSeries: async () => [],
    };

    // All methods are callable and return promises
    expect(fake.getAll()).toBeInstanceOf(Promise);
    expect(fake.getSorted()).toBeInstanceOf(Promise);
    expect(fake.getByLocale("en")).toBeInstanceOf(Promise);
  });
});
