import type { CollectionEntry } from "astro:content";

/**
 * Creates a properly typed mock CollectionEntry<'blog'> for testing.
 * This eliminates the need for `as unknown as CollectionEntry<'blog'>` casts.
 *
 * @param id - The post ID
 * @param pubDate - Publication date
 * @param modDate - Optional modification date
 * @param published - Whether the post is published (default: true)
 * @param overrides - Optional overrides for any fields
 * @returns A fully typed CollectionEntry<'blog'> object
 */
/**
 * Creates a properly typed mock CollectionEntry<'blog'> for testing.
 * This eliminates the need for `as unknown as CollectionEntry<'blog'>` casts.
 *
 * @param id - The post ID
 * @param pubDate - Publication date
 * @param modDate - Optional modification date
 * @param published - Whether the post is published (default: true)
 * @param overrides - Optional overrides for any fields
 * @returns A fully typed CollectionEntry<'blog'> object
 */
export function createMockBlogPost(
  id: string,
  pubDate: Date,
  modDate?: Date | null,
  published: boolean = true,
  overrides?: {
    data?: Partial<CollectionEntry<"blog">["data"]>;
    [key: string]: unknown;
  }
): CollectionEntry<"blog"> {
  const baseData = {
    title: `Post ${id}`,
    author: "Test Author",
    pubDatetime: pubDate,
    modDatetime: modDate ?? null,
    description: "Test post",
    tags: ["test"],
    ...(published ? {} : { draft: true }),
  };

  const mergedData = {
    ...baseData,
    ...overrides?.data,
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data, ...otherOverrides } = overrides || {};

  return {
    id,
    collection: "blog",
    body: "Test content",
    slug: id,
    filePath: `src/content/blog/${id}.md`,
    ...otherOverrides,
    data: mergedData,
  } as CollectionEntry<"blog">;
}
