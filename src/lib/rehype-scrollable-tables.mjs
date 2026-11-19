// src/lib/rehype-scrollable-tables.mjs
/**
 * Rehype plugin: wraps every top-level <table> in a keyboard-focusable scroll
 * region.
 *
 *   <div class="table-scroll" role="region" tabindex="0" aria-label="Table: …">
 *     <table>…</table>
 *   </div>
 *
 * Why: a table wider than the article column scrolls horizontally. A scroll
 * container that cannot receive focus is unreachable for keyboard users
 * (WCAG 2.1.1 Keyboard; axe rule `scrollable-region-focusable`). The accepted
 * pattern is a focusable wrapper with a role and an accessible name, so
 * assistive tech announces what is scrolling.
 *
 * Rules:
 * - Only top-level tables are wrapped (tables inside lists/blockquotes are left
 *   alone, same as rehype-figure-captions).
 * - Accessible name: "<word>: <preceding heading text>", or just "<word>" when
 *   no heading precedes the table. The word is localized from the content file
 *   path (`/blog/<locale>/`); unknown locales fall back to English.
 * - Idempotent: an already-wrapped table is not wrapped again.
 * - Dependency-free manual hast handling (no new supply-chain surface).
 */

const TABLE_WORD = { en: "Table", ka: "ცხრილი" };
const HEADING = /^h[1-6]$/;

function textContent(node) {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(textContent).join("");
}

function localeOf(file) {
  const path = String(file?.path ?? "").replaceAll("\\", "/");
  const match = /\/blog\/([a-z]{2})(?:\/|$)/i.exec(path);
  return match ? match[1].toLowerCase() : "en";
}

export function rehypeScrollableTables() {
  return function (tree, file) {
    if (!Array.isArray(tree.children)) return;

    const word = TABLE_WORD[localeOf(file)] ?? TABLE_WORD.en;
    let lastHeading = "";

    tree.children = tree.children.map(node => {
      if (node?.type === "element" && HEADING.test(node.tagName)) {
        lastHeading = textContent(node).replace(/\s+/g, " ").trim();
        return node;
      }
      if (node?.type !== "element" || node.tagName !== "table") return node;

      return {
        type: "element",
        tagName: "div",
        properties: {
          className: ["table-scroll"],
          role: "region",
          tabIndex: 0,
          ariaLabel: lastHeading ? `${word}: ${lastHeading}` : word,
        },
        children: [node],
      };
    });
  };
}
