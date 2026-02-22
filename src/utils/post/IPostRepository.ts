/**
 * IPostRepository — Data-access contract for blog posts.
 *
 * Applying the Dependency Inversion Principle (SOLID):
 * High-level modules (pages, layouts) depend on this abstraction, not on the
 * concrete `MarkdownPostRepository` that reads from Astro's content layer.
 *
 * Benefits
 * --------
 * - Unit tests can supply a lightweight `FakePostRepository` without mocking
 *   Astro's `getCollection`.
 * - Migrating to a Headless CMS (Contentful, Sanity, etc.) only requires
 *   writing a new class that satisfies this interface — no consumer changes.
 */

import type { CollectionEntry } from "astro:content";
import type { Lang } from "@/i18n/config";
import type { PostWithFallback } from "./repository";

export interface IPostRepository {
  /** Return all published (non-draft) posts, unsorted. */
  getAll(): Promise<CollectionEntry<"blog">[]>;

  /** Return all published posts sorted by publication date (descending). */
  getSorted(): Promise<CollectionEntry<"blog">[]>;

  /** Return all published posts whose ID starts with the given locale prefix. */
  getByLocale(locale: string): Promise<CollectionEntry<"blog">[]>;

  /**
   * Return the best available version of every unique post slug for the given
   * locale, falling back to another locale when no translation exists.
   *
   * @param targetLocale  - Desired output locale.
   * @param includeFallback - Include posts from other locales when the target
   *   locale has no translation (default: `true`).
   */
  getByLocaleWithFallback(
    targetLocale: Lang,
    includeFallback?: boolean
  ): Promise<PostWithFallback[]>;

  /** Return `true` if a post with the given slug exists in the given locale. */
  hasTranslation(slug: string, locale: Lang): Promise<boolean>;

  /** Return a map of locale → post for every available translation of a slug. */
  getTranslations(slug: string): Promise<Map<Lang, CollectionEntry<"blog">>>;

  /** Return all posts tagged with the given (slugified) tag string. */
  getByTag(tag: string): Promise<CollectionEntry<"blog">[]>;

  /** Return all posts where `data.featured === true`. */
  getFeatured(): Promise<CollectionEntry<"blog">[]>;

  /**
   * Return all parts of a series in ascending `series.order`, respecting
   * locale fallbacks.
   */
  getSeries(seriesId: string, locale: Lang): Promise<PostWithFallback[]>;
}
