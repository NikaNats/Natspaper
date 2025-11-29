/**
 * Simple kebab-case converter. Replaces lodash.kebabcase to remove dependency.
 * Handles: spaces, camelCase, PascalCase, special chars, consecutive separators,
 * letter-number transitions, and dots.
 */
function toKebabCase(str: string): string {
  return str
    .replace(/\.+/g, "-") // dots → hyphens (Node.js → Node-js)
    .replace(/([a-z])([A-Z])/g, "$1-$2") // camelCase → camel-Case
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2") // HTMLParser → HTML-Parser
    .replace(/([a-zA-Z])(\d)/g, "$1-$2") // letter→number: Web3 → Web-3
    .replace(/(\d)([a-zA-Z])/g, "$1-$2") // number→letter: 3D → 3-D
    .replace(/[\s_]+/g, "-") // spaces/underscores → hyphen
    .replace(/[^\w-]/g, "") // remove non-word chars (except hyphen)
    .replace(/-+/g, "-") // collapse consecutive hyphens
    .replace(/^-|-$/g, "") // trim leading/trailing hyphens
    .toLowerCase();
}

export const slugifyStr = (str: string) => {
  const cleanStr = str.replace(/C#/g, "CSharp").replace(/c#/g, "csharp");
  return toKebabCase(cleanStr);
};

export const slugifyAll = (arr: string[]) => arr.map(str => slugifyStr(str));

/**
 * Safely extracts the last segment of a path/slug.
 * Guaranteed to return a non-empty string.
 *
 * @param path - The path or slug to extract from (e.g., "en/posts/my-post")
 * @returns The last segment (e.g., "my-article"), or the original path if no segments exist
 *
 * @example
 * getLastPathSegment("en/posts/my-article") // Returns: "my-article"
 * getLastPathSegment("simple-slug") // Returns: "simple-slug"
 * getLastPathSegment("") // Returns: ""
 */
export function getLastPathSegment(path: string | undefined): string {
  if (!path) return "";
  const segments = path.split("/");
  const last = segments[segments.length - 1];
  // Guaranteed to return a string (never undefined)
  return last ?? path;
}
