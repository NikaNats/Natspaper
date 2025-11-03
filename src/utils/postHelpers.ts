import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config";

/**
 * Resolve the final OG image URL for a blog post.
 * Handles multiple OG image sources with proper fallback logic:
 * 1. Direct string URL (remote)
 * 2. Image asset object with src property (local)
 * 3. Dynamic OG image if enabled
 *
 * @param ogImage - OG image from post frontmatter (can be string, object with src, or undefined)
 * @param slug - Post slug for dynamic OG image path construction
 * @param siteUrl - Base site URL for resolving relative URLs (typically Astro.url.origin)
 * @returns Absolute URL to OG image or undefined if no image is available
 *
 * @example
 * // Remote OG image
 * resolveOgImageUrl("https://example.com/og.jpg", "my-post", "https://example.com")
 * // Returns: "https://example.com/og.jpg"
 *
 * @example
 * // Local asset
 * resolveOgImageUrl({ src: "@/images/og.png" }, "my-post", "https://example.com")
 * // Returns: "https://example.com/images/og.png"
 *
 * @example
 * // Dynamic OG image (if SITE.dynamicOgImage is true)
 * resolveOgImageUrl(undefined, "my-post", "https://example.com")
 * // Returns: "https://example.com/posts/my-post/index.png"
 */
export function resolveOgImageUrl(
  ogImage: string | { src: string } | undefined,
  slug: string,
  siteUrl: string
): string | undefined {
  let ogImageUrl: string | undefined;

  // Priority 1: Remote OG image (absolute URL string)
  if (typeof ogImage === "string") {
    ogImageUrl = ogImage;
  }
  // Priority 2: Local asset (object with src property)
  else if (ogImage && typeof ogImage === "object" && "src" in ogImage) {
    // TypeScript knows ogImage may be { src: string }
    ogImageUrl = (ogImage as { src: string }).src;
  }

  // Priority 3: Dynamic OG image (if enabled and no explicit image provided)
  if (!ogImageUrl && SITE.dynamicOgImage) {
    ogImageUrl = `/posts/${slug}/index.png`;
  }

  // Convert relative/dynamic paths to absolute URLs
  if (ogImageUrl) {
    return new URL(ogImageUrl, siteUrl).href;
  }

  return undefined;
}

/**
 * Post metadata for navigation purposes (minimal data structure)
 */
export interface NavigationPost {
  id: string;
  title: string;
  filePath: string | undefined;
}

/**
 * Adjacent posts for navigation (previous and next)
 */
export interface AdjacentPosts {
  previous: NavigationPost | null;
  next: NavigationPost | null;
}

/**
 * Get adjacent posts (previous and next) for pagination navigation.
 * Posts are assumed to be in the correct chronological/sorted order.
 *
 * @param posts - Array of all posts (must be pre-sorted in desired navigation order)
 * @param currentPostId - ID of the current post
 * @returns Object with previous and next post metadata, or null if not available
 *
 * @example
 * const posts = [
 *   { id: "post-1", title: "First", filePath: "..." },
 *   { id: "post-2", title: "Second", filePath: "..." },
 *   { id: "post-3", title: "Third", filePath: "..." }
 * ];
 *
 * const { previous, next } = getAdjacentPosts(posts, "post-2");
 * // previous = { id: "post-1", title: "First", filePath: "..." }
 * // next = { id: "post-3", title: "Third", filePath: "..." }
 */
export function getAdjacentPosts(
  posts: CollectionEntry<"blog">[],
  currentPostId: string
): AdjacentPosts {
  // Extract minimal post metadata for navigation
  const navigationPosts: NavigationPost[] = posts.map(
    ({ data: { title }, id, filePath }) => ({
      id,
      title,
      filePath,
    })
  );

  const currentIndex = navigationPosts.findIndex(
    post => post.id === currentPostId
  );

  // Current post not found
  if (currentIndex === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: currentIndex > 0 ? navigationPosts[currentIndex - 1] : null,
    next:
      currentIndex < navigationPosts.length - 1
        ? navigationPosts[currentIndex + 1]
        : null,
  };
}

/**
 * Generate JSON-LD structured data for a blog post.
 * This supports OpenGraph, SEO, and schema.org standards for better
 * search engine indexing and social media sharing.
 *
 * @param post - Blog post collection entry
 * @param siteUrl - Base site URL
 * @param postUrl - Full URL to the post
 * @returns Structured data object suitable for JSON-LD embedding
 *
 * @example
 * const structuredData = generatePostStructuredData(
 *   post,
 *   "https://example.com",
 *   "https://example.com/posts/my-post"
 * );
 * // Returns: { "@context": "https://schema.org", "@type": "BlogPosting", ... }
 */
export function generatePostStructuredData(
  post: CollectionEntry<"blog">,
  siteUrl: string,
  postUrl: string
) {
  const {
    title,
    description,
    author,
    pubDatetime,
    modDatetime,
    tags,
    ogImage: ogImageData,
  } = post.data;

  const ogImageUrl = resolveOgImageUrl(ogImageData, post.slug, siteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: description,
    author: {
      "@type": "Person",
      name: author,
    },
    datePublished: new Date(pubDatetime).toISOString(),
    dateModified: modDatetime
      ? new Date(modDatetime).toISOString()
      : new Date(pubDatetime).toISOString(),
    image: ogImageUrl ? { "@type": "ImageObject", url: ogImageUrl } : undefined,
    keywords: tags?.join(", "),
    url: postUrl,
  };
}
