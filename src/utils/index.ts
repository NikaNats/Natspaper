/**
 * Utils Barrel Export
 * ===================
 * Single entry point for all utility modules.
 *
 * This barrel file enables cleaner imports throughout the codebase:
 *
 * @example
 * // Before: Deep imports
 * import { getSortedPosts } from '@/utils/post/getSortedPosts';
 * import { slugifyStr } from '@/utils/core/slugify';
 *
 * // After: Clean barrel imports
 * import { getSortedPosts, slugifyStr } from '@/utils';
 *
 * Module Organization:
 * - core/        - Generic utilities (slugify, concurrency)
 * - post/        - Blog post operations (sorting, filtering, tags)
 * - features/    - Client-side features (progress bar, heading links)
 * - og/          - Open Graph image generation
 * - rss/         - RSS feed utilities
 * - seo/         - Structured data and SEO helpers
 * - analytics/   - Analytics tracking service
 * - i18n/        - Locale-aware formatting utilities
 * - transformers/- Shiki code block transformers
 */

// ============================================================
// CORE UTILITIES
// Generic, domain-agnostic helpers
// ============================================================
export { ConcurrencyLimiter, ogImageLimiter } from "./core";
export { slugifyStr, slugifyAll } from "./core";

// ============================================================
// POST UTILITIES
// Blog content operations
// ============================================================
export {
  getPostsByTag,
  getSortedPosts,
  getUniqueTags,
  postFilter,
  getAdjacentPosts,
  resolveOgImageUrl,
  generatePostStructuredData,
  calculateReadingTime,
  calculateReadingTimeFromWords,
  formatReadingTime,
  getReadingTimeDisplay,
} from "./post";

// ============================================================
// FEATURE UTILITIES
// Client-side interactive features
// ============================================================
export { featureManager } from "./features";
export type { Feature } from "./features";

// ============================================================
// OG IMAGE UTILITIES
// Social media image generation
// ============================================================
export { generateOgImageForPost } from "./og";

// ============================================================
// RSS UTILITIES
// Feed generation helpers
// ============================================================
export { escapeHtml, sanitizeDescription, sanitizeMarkdownUrls } from "./rss";

// ============================================================
// SEO UTILITIES
// Structured data and meta helpers
// ============================================================
export {
  generateBlogPostingSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema,
  combineSchemas,
} from "./seo";

// ============================================================
// ANALYTICS
// Tracking service
// ============================================================
export { analyticsService } from "./analytics";

// ============================================================
// I18N UTILITIES
// Locale-aware formatting
// ============================================================
export {
  formatDate,
  formatNumber,
  formatReadingTimeLocalized,
  formatRelativeTime,
  getCopyrightText,
} from "./i18n";

// ============================================================
// TRANSFORMERS
// Code block enhancements
// ============================================================
export { transformerFileName } from "./transformers";
