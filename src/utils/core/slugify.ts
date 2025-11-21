import kebabcase from "lodash.kebabcase";

export const slugifyStr = (str: string) => kebabcase(str);

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
