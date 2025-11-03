/**
 * Deprecated helper kept for compatibility during migration.
 * Prefer using the collection entry's `slug` property and build links like `/posts/${slug}`.
 */
export function getPath(id: string, _filePath?: string, includeBase = true) {
  const slug = String(id).split("/").slice(-1)[0];
  return `${includeBase ? "/posts" : ""}/${slug}`;
}
