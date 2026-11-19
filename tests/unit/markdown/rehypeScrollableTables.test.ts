/**
 * Test Suite: rehypeScrollableTables plugin
 * Top-level <table> -> focusable, named scroll region (WCAG 2.1.1).
 */

import { describe, it, expect } from "vitest";
import { rehypeScrollableTables } from "../../../src/lib/rehype-scrollable-tables.mjs";

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

/** Indexed access that fails loudly instead of returning undefined. */
function at(nodes: Node[] | undefined, index: number): Node {
  const node = nodes?.[index];
  if (!node) throw new Error(`expected a node at index ${index}`);
  return node;
}

function run(children: Node[], path = "/proj/src/content/blog/en/post.md") {
  const tree = { type: "root", children };
  (
    rehypeScrollableTables as unknown as () => (t: unknown, f: unknown) => void
  )()(tree, { path });
  return tree.children;
}

const labelOf = (nodes: Node[], index: number) =>
  at(nodes, index).properties?.ariaLabel;

describe("rehypeScrollableTables", () => {
  it("wraps a top-level table in a focusable, named region", () => {
    const table = el("table");
    const wrapper = at(run([table]), 0);

    expect(wrapper.tagName).toBe("div");
    expect(wrapper.properties).toMatchObject({
      className: ["table-scroll"],
      role: "region",
      tabIndex: 0,
      ariaLabel: "Table",
    });
    expect(wrapper.children).toEqual([table]);
  });

  it("names the region after the preceding heading", () => {
    const out = run([
      el("h2", [text("Latency "), el("em", [text("budgets")])]),
      el("p", [text("intro")]),
      el("table"),
    ]);
    expect(labelOf(out, 2)).toBe("Table: Latency budgets");
  });

  it("uses the nearest preceding heading for each table", () => {
    const out = run([
      el("h2", [text("One")]),
      el("table"),
      el("h2", [text("Two")]),
      el("table"),
    ]);
    expect(labelOf(out, 1)).toBe("Table: One");
    expect(labelOf(out, 3)).toBe("Table: Two");
  });

  it("localizes the label word from the content path (ka)", () => {
    const out = run([el("table")], "C:\\site\\src\\content\\blog\\ka\\post.md");
    expect(labelOf(out, 0)).toBe("ცხრილი");
  });

  it("falls back to English for an unknown locale or missing path", () => {
    expect(labelOf(run([el("table")], "/x/blog/fr/post.md"), 0)).toBe("Table");
    expect(labelOf(run([el("table")], ""), 0)).toBe("Table");
  });

  it("leaves nested tables and other nodes untouched", () => {
    const nested = el("table");
    const list = el("ul", [el("li", [nested])]);
    const para = el("p", [text("hi")]);
    const out = run([para, list]);

    expect(out).toEqual([para, list]);
    expect(at(at(list.children, 0).children, 0)).toBe(nested);
  });

  it("does not re-wrap an already wrapped table", () => {
    const twice = run(run([el("table")]));
    expect(at(at(twice, 0).children, 0).tagName).toBe("table");
  });
});
