import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { slugifyStr } from "../core/slugify";
import { DEFAULT_LANG, type Lang } from "@/i18n/config";
import type { IPostRepository } from "./IPostRepository";

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

// Encapsulate sorting/filtering logic here
export const PostRepository: IPostRepository = {
  getAll: async (): Promise<CollectionEntry<"blog">[]> => {
    // FIX: Explicitly type the destructured 'data' property
    return await getCollection(
      "blog",
      ({ data }: CollectionEntry<"blog">) => !data.draft
    );
  },

  getSorted: async (): Promise<CollectionEntry<"blog">[]> => {
    const posts = await PostRepository.getAll();
    return posts.sort(
      (a, b) =>
        Math.floor(new Date(b.data.pubDatetime).getTime() / 1000) -
        Math.floor(new Date(a.data.pubDatetime).getTime() / 1000)
    );
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
  getByLocaleWithFallback: async (
    targetLocale: Lang,
    includeFallback: boolean = true
  ): Promise<PostWithFallback[]> => {
    const allPosts = await PostRepository.getSorted();

    // Helper: Extract slug from post ID (e.g., "ka/my-post.md" → "my-post")
    const getSlug = (id: string) =>
      id
        .split("/")
        .slice(1)
        .join("/")
        .replace(/\.(md|mdx)$/, "");

    // Helper: Extract locale from post ID
    const getLocale = (id: string) => id.split("/")[0] as Lang;

    // Group posts by slug
    const postsBySlug = new Map<string, CollectionEntry<"blog">[]>();

    for (const post of allPosts) {
      const slug = getSlug(post.id);
      if (!postsBySlug.has(slug)) {
        postsBySlug.set(slug, []);
      }
      postsBySlug.get(slug)?.push(post);
    }

    const results: PostWithFallback[] = [];

    // Iterate through each unique post slug
    for (const [, variations] of postsBySlug.entries()) {
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
      } else if (includeFallback) {
        // 2. Fallback: Use first available version (prefer DEFAULT_LANG, then any)
        const fallback =
          variations.find(p => p.id.startsWith(`${DEFAULT_LANG}/`)) ||
          variations[0];

        if (fallback) {
          const fallbackLocale = getLocale(fallback.id);
          results.push({
            post: fallback,
            isFallback: true,
            originalLocale: fallbackLocale,
          });
        }
      }
    }

    // Sort by publication date (descending)
    return results.sort(
      (a, b) =>
        Math.floor(new Date(b.post.data.pubDatetime).getTime() / 1000) -
        Math.floor(new Date(a.post.data.pubDatetime).getTime() / 1000)
    );
  },

  /**
   * Check if a specific post has a translation in the given locale
   */
  hasTranslation: async (slug: string, locale: Lang): Promise<boolean> => {
    const posts = await PostRepository.getByLocale(locale);
    const getSlug = (id: string) => id.split("/").slice(1).join("/");
    return posts.some(post => getSlug(post.id) === slug);
  },

  /**
   * Get all available translations for a post
   */
  getTranslations: async (
    slug: string
  ): Promise<Map<Lang, CollectionEntry<"blog">>> => {
    const allPosts = await PostRepository.getAll();
    const getSlug = (id: string) => id.split("/").slice(1).join("/");
    const getLocale = (id: string) => id.split("/")[0] as Lang;

    const translations = new Map<Lang, CollectionEntry<"blog">>();

    for (const post of allPosts) {
      if (getSlug(post.id) === slug) {
        translations.set(getLocale(post.id), post);
      }
    }

    return translations;
  },

  getByTag: async (tag: string): Promise<CollectionEntry<"blog">[]> => {
    const posts = await PostRepository.getSorted();
    return posts.filter(post =>
      // FIX: Explicitly type the 't' parameter
      post.data.tags.map((t: string) => slugifyStr(t)).includes(tag)
    );
  },

  getFeatured: async (): Promise<CollectionEntry<"blog">[]> => {
    const posts = await PostRepository.getSorted();
    return posts.filter(post => post.data.featured);
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
