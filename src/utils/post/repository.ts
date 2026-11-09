import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { DEFAULT_LANG, type Lang } from "@/i18n/config";
import type { IPostRepository } from "./IPostRepository";
import postFilter from "./postFilter";
import { comparePostsByPubDate } from "./getSortedPosts";

/**
 * Post with fallback information
 * Used when displaying posts that may not exist in the current locale
 */
export interface PostWithFallback {
  post: CollectionEntry<"blog">;
  /** True if this post is from the fallback locale (English) */
  isFallback: boolean;
  /** The original locale of the post */
  originalLocale: Lang;
}

/** "ka/my-post" → "ka" */
const getLocale = (id: string) => id.split("/")[0] as Lang;

/** "ka/my-post" → "my-post" (extension stripped defensively) */
const getSlug = (id: string) =>
  id
    .split("/")
    .slice(1)
    .join("/")
    .replace(/\.(md|mdx)$/, "");

/**
 * Per-locale memo for `getByLocaleWithFallback`.
 *
 * Every post page, tag page and the archive call it, so without a memo a
 * static build recomputes the same grouping O(pages) times. Content is
 * immutable during a production build, so the memo is safe there; in dev it
 * is bypassed so edits to Markdown show up immediately.
 */
const fallbackCache = new Map<string, Promise<PostWithFallback[]>>();

export const PostRepository: IPostRepository = {
  /**
   * Single visibility gate for the whole site: drafts AND scheduled
   * (future-dated) posts are excluded here, so every route that reads through
   * the repository agrees on what is published.
   */
  getAll: async (): Promise<CollectionEntry<"blog">[]> => {
    const posts = await getCollection("blog", postFilter);

    return posts.map((post: CollectionEntry<"blog">) => {
      if (!post.slug) {
        Object.defineProperty(post, "slug", {
          value: post.id,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      return post;
    });
  },

  getSorted: async (): Promise<CollectionEntry<"blog">[]> => {
    const posts = await PostRepository.getAll();
    return posts.sort(comparePostsByPubDate);
  },

  getByLocale: async (locale: string): Promise<CollectionEntry<"blog">[]> => {
    const posts = await PostRepository.getSorted();
    return posts.filter(post => post.id.startsWith(`${locale}/`));
  },

  /**
   * BIDIRECTIONAL FALLBACK SYSTEM
   *
   * Groups posts by slug and returns the best available version:
   * 1. First tries to match the target locale
   * 2. If missing, falls back to any available locale (preferring DEFAULT_LANG)
   *
   * This enables URLs like:
   * - /ka/posts/my-post → Georgian version (if exists)
   * - /ka/posts/my-post → English version (if Georgian missing)
   * - /en/posts/georgian-only → Georgian version (if English missing)
   *
   * @param targetLocale - Target locale to get posts for
   * @param includeFallback - Whether to include fallback posts (default: true)
   */
  getByLocaleWithFallback: (
    targetLocale: Lang,
    includeFallback: boolean = true
  ): Promise<PostWithFallback[]> => {
    const key = `${targetLocale}:${includeFallback}`;
    const cached = import.meta.env.DEV ? undefined : fallbackCache.get(key);
    if (cached) return cached;

    const result = (async () => {
      const allPosts = await PostRepository.getSorted();

      const postsBySlug = new Map<string, CollectionEntry<"blog">[]>();
      for (const post of allPosts) {
        const slug = getSlug(post.id);
        const group = postsBySlug.get(slug);
        if (group) group.push(post);
        else postsBySlug.set(slug, [post]);
      }

      const results: PostWithFallback[] = [];

      for (const variations of postsBySlug.values()) {
        // 1. Try exact match for target locale
        const exactMatch = variations.find(p =>
          p.id.startsWith(`${targetLocale}/`)
        );

        if (exactMatch) {
          results.push({
            post: exactMatch,
            isFallback: false,
            originalLocale: targetLocale,
          });
          continue;
        }

        if (!includeFallback) continue;

        // 2. Fallback: prefer DEFAULT_LANG, then any available version
        const fallback =
          variations.find(p => p.id.startsWith(`${DEFAULT_LANG}/`)) ??
          variations[0];

        if (fallback) {
          results.push({
            post: fallback,
            isFallback: true,
            originalLocale: getLocale(fallback.id),
          });
        }
      }

      return results.sort((a, b) => comparePostsByPubDate(a.post, b.post));
    })();

    if (!import.meta.env.DEV) {
      fallbackCache.set(key, result);
      // Never memoize a failure — let the next caller retry.
      result.catch(() => fallbackCache.delete(key));
    }
    return result;
  },

  /**
   * Retrieves all parts of a series, respecting locale fallbacks.
   */
  getSeries: async (
    seriesId: string,
    locale: Lang
  ): Promise<PostWithFallback[]> => {
    const allWithFallbacks =
      await PostRepository.getByLocaleWithFallback(locale);

    return allWithFallbacks
      .filter(p => p.post.data.series?.id === seriesId)
      .sort(
        (a, b) =>
          (a.post.data.series?.order ?? 0) - (b.post.data.series?.order ?? 0)
      );
  },
};

/**
 * `MarkdownPostRepository` is the canonical name for the concrete implementation
 * that reads from Astro's Markdown/MDX content layer.
 *
 * `PostRepository` is kept as the primary export for backward compatibility
 * with all existing import sites.  Both identifiers refer to the same object.
 *
 * When migrating to a Headless CMS, create a new class/object that satisfies
 * `IPostRepository` and swap the binding here — zero consumer changes required.
 */
export const MarkdownPostRepository: IPostRepository = PostRepository;
