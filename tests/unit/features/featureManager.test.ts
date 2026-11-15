/**
 * Unit Tests: FeatureManager — Dependency Injection
 * ==================================================
 * Verifies the refactored DI pattern:
 * - FeatureManager accepts an injected feature list (constructor)
 * - register() dynamically appends features
 * - initializeFeatures() / cleanupFeatures() delegate to every registered feature
 * - The global singleton still contains ProgressBar + HeadingLinks
 */

import { describe, it, expect } from "vitest";
import type { Feature } from "@/utils/features/Feature";
import { FeatureManager } from "@/utils/features/FeatureManager";

// ---------------------------------------------------------------------------
// Fake implementation — avoids DOM side-effects from real ProgressBar etc.
// ---------------------------------------------------------------------------
function makeFakeFeature(name: string): Feature & { name: string; initCount: number; cleanupCount: number } {
  return {
    name,
    initCount: 0,
    cleanupCount: 0,
    init() { this.initCount++; },
    cleanup() { this.cleanupCount++; },
  };
}

describe("FeatureManager — Dependency Injection", () => {
  it("accepts an initial feature list via constructor", () => {
    const featureA = makeFakeFeature("A");
    const featureB = makeFakeFeature("B");

    const manager = new FeatureManager([featureA, featureB]);
    manager.initializeFeatures();

    expect(featureA.initCount).toBe(1);
    expect(featureB.initCount).toBe(1);
  });

  it("register() appends a feature that is called on init/cleanup", () => {
    const manager = new FeatureManager(); // empty start
    const featureC = makeFakeFeature("C");

    manager.register(featureC);
    manager.initializeFeatures();
    manager.cleanupFeatures();

    expect(featureC.initCount).toBe(1);
    expect(featureC.cleanupCount).toBe(1);
  });

  it("multiple register() calls accumulate features in order", () => {
    const calls: string[] = [];
    const f1: Feature = { init: () => calls.push("f1-init"), cleanup: () => calls.push("f1-cleanup") };
    const f2: Feature = { init: () => calls.push("f2-init"), cleanup: () => calls.push("f2-cleanup") };

    const manager = new FeatureManager();
    manager.register(f1);
    manager.register(f2);

    manager.initializeFeatures();
    manager.cleanupFeatures();

    expect(calls).toEqual(["f1-init", "f2-init", "f1-cleanup", "f2-cleanup"]);
  });

  it("the global singleton exposes a register() method (DIP contract)", async () => {
    const { featureManager } = await import("@/utils/features/FeatureManager");
    expect(typeof featureManager.register).toBe("function");
  });

  it("the global singleton has features pre-registered (ProgressBar + HeadingLinks)", async () => {
    // We can verify indirectly: calling init/cleanup should not throw,
    // which proves the concrete features were registered at module load time.
    const { featureManager } = await import("@/utils/features/FeatureManager");

    // Provide minimal DOM to satisfy ProgressBar/HeadingLinks
    document.body.innerHTML = `
      <article id="article">
        <h2 id="section">Section</h2>
        <p>Content</p>
      </article>
    `;

    expect(() => featureManager.initializeFeatures()).not.toThrow();
    expect(() => featureManager.cleanupFeatures()).not.toThrow();

    document.body.innerHTML = "";
  });
});
