/**
 * Test Suite: rehypeEagerFirstImage plugin
 * First content image per document becomes the LCP candidate.
 */

import { describe, it, expect } from "vitest";
import { rehypeEagerFirstImage } from "../../../src/lib/rehype-eager-first-image.mjs";

function runPlugin(children: Array<Record<string, unknown>>) {
  const transform = (
    rehypeEagerFirstImage as unknown as () => (tree: unknown) => void
  )();
  transform({ type: "root", children });
}

function img(props: Record<string, unknown> = {}) {
  return { type: "element", tagName: "img", properties: { ...props }, children: [] };
}

describe("rehypeEagerFirstImage", () => {
  it("marks the first image eager with high fetch priority", () => {
    const first = img({ src: "a.jpg", alt: "A" });
    const tree = { children: [{ type: "element", tagName: "p", properties: {}, children: [first] }] };
    (rehypeEagerFirstImage as unknown as () => (tree: unknown) => void)()(tree);

    expect(first.properties.loading).toBe("eager");
    expect(first.properties.fetchPriority).toBe("high");
  });

  it("leaves subsequent images untouched", () => {
    const first = img({ src: "a.jpg" });
    const second = img({ src: "b.jpg" });
    runPlugin([first, second]);

    expect(first.properties.loading).toBe("eager");
    expect(second.properties.loading).toBeUndefined();
    expect(second.properties.fetchPriority).toBeUndefined();
  });

  it("never overrides an explicit author loading attribute", () => {
    const first = img({ src: "a.jpg", loading: "lazy" });
    runPlugin([first]);

    expect(first.properties.loading).toBe("lazy");
    expect(first.properties.fetchPriority).toBeUndefined();
  });

  it("handles documents without images", () => {
    expect(() =>
      runPlugin([{ type: "element", tagName: "p", properties: {}, children: [] }])
    ).not.toThrow();
  });

  it("handles image nodes missing the properties object", () => {
    const bare: { type: string; tagName: string; properties?: Record<string, unknown>; children: unknown[] } = {
      type: "element",
      tagName: "img",
      children: [],
    };
    runPlugin([bare as unknown as Record<string, unknown>]);

    expect(bare.properties?.loading).toBe("eager");
  });
});
