import { getCollection, type CollectionEntry } from "astro:content";
import { getSortedPosts } from "@/utils/post";
import type { Lang } from "@/i18n/config"; // SSOT Import

export class ContentRepository {
  private static instance: ContentRepository;
  private postsCache: CollectionEntry<"blog">[] | null = null;

  private constructor() {}

  public static getInstance(): ContentRepository {
    if (!ContentRepository.instance) {
      ContentRepository.instance = new ContentRepository();
    }
    return ContentRepository.instance;
  }

  /**
   * Fetches all posts, handling caching and draft filtering automatically.
   */
  private async getAllPosts(): Promise<CollectionEntry<"blog">[]> {
    if (this.postsCache) return this.postsCache;

    const posts = await getCollection("blog", ({ data }) => {
      // Centralized draft logic: Show drafts in DEV, hide in PROD
      return import.meta.env.DEV || !data.draft;
    });

    this.postsCache = posts;
    return posts;
  }

  /**
   * Get sorted posts for a specific locale.
   */
  public async getPostsByLocale(
    locale: Lang
  ): Promise<CollectionEntry<"blog">[]> {
    const allPosts = await this.getAllPosts();
    const localizedPosts = allPosts.filter(post =>
      post.slug.startsWith(`${locale}/`)
    );
    return getSortedPosts(localizedPosts);
  }

  /**
   * Get a specific post by slug and locale, ensuring it exists.
   */
  public async getPost(
    locale: Lang,
    slug: string
  ): Promise<CollectionEntry<"blog"> | undefined> {
    const posts = await this.getAllPosts();
    // Handle the fact that content collection slugs include the locale prefix
    return posts.find(p => p.slug === `${locale}/${slug}`);
  }

  /**
   * Get featured posts for a locale
   */
  public async getFeaturedPosts(
    locale: Lang
  ): Promise<CollectionEntry<"blog">[]> {
    const posts = await this.getPostsByLocale(locale);
    return posts.filter(p => p.data.featured);
  }
}

export const contentRepo = ContentRepository.getInstance();
