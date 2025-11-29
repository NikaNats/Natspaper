import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { slugifyStr } from "../core/slugify";
import { DEFAULT_LANG, type Lang } from "@/i18n/config";

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
export const PostRepository = {
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
   * Get posts for a locale with fallback to English for missing translations
   *
   * When a post exists in English but not in the target locale:
   * - Returns the English post marked with isFallback: true
   * - UI can display an "English only" badge
   *
   * @param locale - Target locale to get posts for
   * @param includeFallback - Whether to include English fallback posts (default: true)
   */
  getByLocaleWithFallback: async (
    locale: Lang,
    includeFallback: boolean = true
  ): Promise<PostWithFallback[]> => {
    const allPosts = await PostRepository.getSorted();

    // Get posts in the target locale
    const localePosts = allPosts.filter(post =>
      post.id.startsWith(`${locale}/`)
    );

    // If we don't want fallback, just return locale posts
    if (!includeFallback || locale === DEFAULT_LANG) {
      return localePosts.map(post => ({
        post,
        isFallback: false,
        originalLocale: locale,
      }));
    }

    // Get English (default) posts
    const englishPosts = allPosts.filter(post =>
      post.id.startsWith(`${DEFAULT_LANG}/`)
    );

    // Extract slugs (without locale prefix) for comparison
    const getSlug = (id: string) => id.split("/").slice(1).join("/");

    const localeSlugs = new Set(localePosts.map(p => getSlug(p.id)));

    // Find English posts that don't have a translation in the target locale
    const fallbackPosts = englishPosts.filter(
      post => !localeSlugs.has(getSlug(post.id))
    );

    // Combine locale posts with fallback posts
    const result: PostWithFallback[] = [
      ...localePosts.map(post => ({
        post,
        isFallback: false,
        originalLocale: locale,
      })),
      ...fallbackPosts.map(post => ({
        post,
        isFallback: true,
        originalLocale: DEFAULT_LANG,
      })),
    ];

    // Sort by publication date (descending)
    return result.sort(
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
};
