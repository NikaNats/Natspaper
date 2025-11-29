/**
 * @deprecated This helper is no longer needed with Astro Content Collections.
 * Use the collection entry's `id` property and build links like:
 * `/${locale}/posts/${id.split('/').pop()?.replace(/\.(md|mdx)$/, '')}`
 *
 * This function will be removed in a future version.
 *
 * @param id - Collection entry ID
 * @param _filePath - Unused parameter (kept for API compatibility)
 * @param includeBase - Whether to include "/posts" prefix
 * @returns Post URL path
 */
export function getPath(
  id: string,
  _filePath?: string,
  includeBase = true
): string {
  const slug = String(id).split("/").slice(-1)[0];
  return `${includeBase ? "/posts" : ""}/${slug}`;
}
