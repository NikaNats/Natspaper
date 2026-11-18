// src/lib/rehype-figure-captions.mjs
/**
 * Rehype plugin: turns Markdown image + italic caption into <figure>.
 *
 * Authors write:
 *
 *   ![alt](image.png)
 *
 *   *Caption text, may contain [links](https://…).*
 *
 * which Markdown compiles to two sibling paragraphs: <p><img></p> and
 * <p><em>…</em></p>. The figure/figcaption styles in typography.css never
 * match that markup, so captions rendered as ordinary body paragraphs.
 *
 * Rules:
 * - Only top-level paragraphs are considered (images inside lists, tables or
 *   blockquotes are left alone).
 * - A paragraph qualifies as an image paragraph when its only non-whitespace
 *   child is an <img>; a caption paragraph when its only non-whitespace child
 *   is an <em>. Whitespace text nodes between blocks are skipped.
 * - Every standalone image becomes a <figure>; the caption is attached only
 *   when the very next block is an italic-only paragraph.
 * - The <em> wrapper is dropped (figcaption is styled italic in CSS) and its
 *   children, including links, are moved into <figcaption> unchanged.
 * - Dependency-free manual hast handling (no new supply-chain surface).
 */

function isWhitespaceText(node) {
  return node?.type === "text" && !/\S/.test(node.value ?? "");
}

/** Returns the single meaningful child of a <p> with the given tag, or null. */
function soleChildOfParagraph(node, tagName) {
  if (node?.type !== "element" || node.tagName !== "p") return null;
  const meaningful = (node.children ?? []).filter(c => !isWhitespaceText(c));
  if (meaningful.length !== 1) return null;
  const [child] = meaningful;
  return child.type === "element" && child.tagName === tagName ? child : null;
}

export function rehypeFigureCaptions() {
  return function (tree) {
    if (!Array.isArray(tree.children)) return;

    const out = [];
    const nodes = tree.children;

    for (let i = 0; i < nodes.length; i++) {
      const img = soleChildOfParagraph(nodes[i], "img");
      if (!img) {
        out.push(nodes[i]);
        continue;
      }

      // Look past whitespace text nodes for a caption paragraph.
      let j = i + 1;
      while (j < nodes.length && isWhitespaceText(nodes[j])) j++;
      const em = soleChildOfParagraph(nodes[j], "em");

      const children = [img];
      if (em) {
        children.push({
          type: "element",
          tagName: "figcaption",
          properties: {},
          children: em.children ?? [],
        });
        i = j; // consume the caption (and the whitespace before it)
      }

      out.push({
        type: "element",
        tagName: "figure",
        properties: {},
        children,
      });
    }

    tree.children = out;
  };
}
