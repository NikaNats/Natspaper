import { getLastPathSegment } from "@/utils/core/slugify";
import type { Lang } from "@/i18n/config";

/**
 * Strip a trailing markdown extension, if present.
 *
 * The glob content loader produces extension-free entry IDs
 * (e.g. "en/my-post"), but this guards against raw file paths
 * reaching this helper via future refactors or CMS migrations.
 */
function stripMarkdownExtension(slug: string): string {
  return slug.replace(/\.(md|mdx)$/i, "");
}

/**
 * Extract the canonical URL slug for a blog collection entry.
 *
 * Content-layer entry IDs are locale-prefixed by the glob loader
 * (e.g. "en/my-post"), while public routes are keyed on the bare slug
 * ("/en/posts/my-post"). This is the single source of truth for that
 * mapping — never construct a post slug inline.
 *
 * @param postIdOrSlug - Entry ID ("ka/my-post") or already-bare slug ("my-post")
 * @returns Bare slug safe for use in "/{locale}/posts/{slug}" URLs
 *
 * @example
 * getPostSlug("en/system-design-part-1") // "system-design-part-1"
 * getPostSlug("my-post")                 // "my-post"
 */
export function getPostSlug(postIdOrSlug: string | undefined): string {
  return stripMarkdownExtension(getLastPathSegment(postIdOrSlug));
}

/**
 * Build the canonical, locale-aware URL for a post.
 *
 * Single source of truth for the "/{locale}/posts/{slug}" route contract.
 * Accepts either a locale-prefixed entry ID or a bare slug; the leading
 * locale segment of the identifier is always discarded in favor of the
 * explicitly provided target locale (which may differ under the fallback
 * system).
 *
 * @param locale - Target route locale (e.g. "en" | "ka")
 * @param postIdOrSlug - Entry ID ("en/my-post") or bare slug ("my-post")
 * @returns Absolute-path URL for the post's detail page
 *
 * @example
 * getPostUrl("ka", "en/system-design-part-1") // "/ka/posts/system-design-part-1"
 * getPostUrl("en", "my-post")                 // "/en/posts/my-post"
 */
export function getPostUrl(
  locale: Lang | string,
  postIdOrSlug: string | undefined
): string {
  return `/${locale}/posts/${getPostSlug(postIdOrSlug)}`;
}
