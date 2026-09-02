// tests/unit/core/scrollDrivenAnimations.test.ts
// Regression tests for the W3C Scroll-driven Animations integration:
// CSS scroll-timeline takeover for the reading progress bar and the
// Back-To-Top reveal/radial ring, with the JS fallback contract preserved
// for happy-dom unit tests and legacy engines.
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("W3C Scroll-driven Animations Implementation", () => {
  it("defines scroll-timeline keyframes in components.css", () => {
    const componentsCss = read("src/styles/components.css");

    expect(componentsCss).toContain("@keyframes grow-reading-progress");
    expect(componentsCss).toContain("transform: scaleX(0);");
    expect(componentsCss).toContain("transform: scaleX(1);");
    expect(componentsCss).toContain("animation-timeline: scroll(root block);");
  });

  it("configures scroll-timeline and @property radial fill in BackToTopButton.astro", () => {
    const bttContent = read("src/components/features/BackToTopButton.astro");

    expect(bttContent).toContain("@keyframes reveal-back-to-top");
    // The conic-gradient ring can only animate with a registered property.
    expect(bttContent).toContain("@property --btt-progress");
    expect(bttContent).toContain("animation-timeline: scroll(root block);");
    expect(bttContent).toContain("@supports not (animation-timeline: scroll())");
  });

  it("preserves className and width update in progressBar.ts for happy-dom tests", () => {
    const progressBarTs = read("src/utils/features/progressBar.ts");

    expect(progressBarTs).toContain("fixed");
    expect(progressBarTs).toContain("bg-accent");
    expect(progressBarTs).toContain("this.bar.style.width =");
  });
});
