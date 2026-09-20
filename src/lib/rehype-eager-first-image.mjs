// src/lib/rehype-eager-first-image.mjs
/**
 * Rehype plugin: marks the first content image as an LCP candidate.
 *
 * Markdown image syntax cannot carry loading attributes, so Astro renders
 * every content image as `loading="lazy"` — including hero-adjacent figures
 * that sit above the fold and delay Largest Contentful Paint. This plugin
 * upgrades only the first `<img>` in each document to `loading="eager"` with
 * `fetchpriority="high"`.
 *
 * Rules:
 * - Only the first image per document is touched (LCP is a single element).
 * - An explicit author `loading` attribute is never overridden.
 * - Dependency-free manual hast traversal (no new supply-chain surface).
 * - Astro's image pipeline preserves author-specified loading attributes,
 *   so the eager hint survives optimization (verified in dist output).
 */

function visitElements(node, onElement) {
  if (!node || typeof node !== "object") return false;
  if (node.type === "element") {
    if (onElement(node) === true) return true;
  }
  const children = node.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      if (visitElements(child, onElement) === true) return true;
    }
  }
  return false;
}

export function rehypeEagerFirstImage() {
  return function (tree) {
    visitElements(tree, node => {
      if (node.tagName !== "img") return false;
      if (!node.properties || typeof node.properties !== "object") {
        node.properties = {};
      }
      // Respect explicit author control; either way the LCP slot is taken.
      if (node.properties.loading) return true;
      node.properties.loading = "eager";
      node.properties.fetchPriority = "high";
      return true;
    });
  };
}
