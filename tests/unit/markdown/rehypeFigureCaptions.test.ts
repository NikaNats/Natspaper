/**
 * Test Suite: rehypeFigureCaptions plugin
 * Markdown image paragraph + following italic paragraph -> <figure>/<figcaption>.
 */

import { describe, it, expect } from "vitest";
import { rehypeFigureCaptions } from "../../../src/lib/rehype-figure-captions.mjs";

type Node = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
};

const text = (value: string): Node => ({ type: "text", value });
const el = (tagName: string, children: Node[] = [], properties = {}): Node => ({
  type: "element",
  tagName,
  properties,
  children,
});
const img = (src = "a.png") => el("img", [], { src, alt: "alt" });

function run(children: Node[]): Node[] {
  const tree = { type: "root", children };
  (rehypeFigureCaptions as unknown as () => (t: unknown) => void)()(tree);
  return tree.children;
}

describe("rehypeFigureCaptions", () => {
  it("wraps image + italic paragraph into figure with figcaption", () => {
    const image = img();
    const out = run([
      el("p", [image]),
      text("\n"),
      el("p", [el("em", [text("Caption")])]),
    ]);

    expect(out).toHaveLength(1);
    const [figure] = out;
    expect(figure?.tagName).toBe("figure");
    expect(figure?.children?.[0]).toBe(image);
    expect(figure?.children?.[1]?.tagName).toBe("figcaption");
    expect(figure?.children?.[1]?.children).toEqual([text("Caption")]);
  });

  it("preserves links inside the caption", () => {
    const link = el("a", [text("Author")], { href: "https://example.com" });
    const [figure] = run([
      el("p", [img()]),
      el("p", [el("em", [text("Photo by "), link])]),
    ]);

    expect(figure?.children?.[1]?.children?.[1]).toBe(link);
  });

  it("wraps a standalone image without a caption", () => {
    const out = run([el("p", [img()]), el("p", [text("Body text")])]);

    expect(out).toHaveLength(2);
    expect(out[0]?.tagName).toBe("figure");
    expect(out[0]?.children).toHaveLength(1);
    expect(out[1]?.tagName).toBe("p");
  });

  it("does not treat a paragraph with mixed content as a caption", () => {
    const mixed = el("p", [el("em", [text("Italic")]), text(" and plain")]);
    const out = run([el("p", [img()]), mixed]);

    expect(out[0]?.children).toHaveLength(1);
    expect(out[1]).toBe(mixed);
  });

  it("leaves paragraphs with an image among other text untouched", () => {
    const inline = el("p", [text("See "), img(), text(" here")]);
    const out = run([inline]);

    expect(out).toEqual([inline]);
  });

  it("ignores whitespace text inside the image paragraph", () => {
    const out = run([el("p", [text("\n"), img(), text(" ")])]);

    expect(out[0]?.tagName).toBe("figure");
  });

  it("leaves a lone italic paragraph without a preceding image untouched", () => {
    const italic = el("p", [el("em", [text("Just emphasis")])]);
    const out = run([el("p", [text("Intro")]), italic]);

    expect(out).toHaveLength(2);
    expect(out[1]).toBe(italic);
  });

  it("turns two consecutive images into two figures, not image+caption", () => {
    const first = img("a.png");
    const second = img("b.png");
    const out = run([el("p", [first]), el("p", [second])]);

    expect(out).toHaveLength(2);
    expect(out.map(n => n.tagName)).toEqual(["figure", "figure"]);
    expect(out[0]?.children).toEqual([first]);
    expect(out[1]?.children).toEqual([second]);
  });

  it("wraps an image paragraph at the very end of the document", () => {
    const out = run([el("p", [text("Body")]), el("p", [img()])]);

    expect(out).toHaveLength(2);
    expect(out[1]?.tagName).toBe("figure");
    expect(out[1]?.children).toHaveLength(1);
  });

  it("attaches an empty <em> as an empty figcaption (current behaviour)", () => {
    const [figure] = run([el("p", [img()]), el("p", [el("em", [])])]);

    expect(figure?.children).toHaveLength(2);
    expect(figure?.children?.[1]?.tagName).toBe("figcaption");
    expect(figure?.children?.[1]?.children).toEqual([]);
  });

  it("handles trees without children", () => {
    expect(() =>
      (rehypeFigureCaptions as unknown as () => (t: unknown) => void)()({ type: "root" })
    ).not.toThrow();
  });
});
