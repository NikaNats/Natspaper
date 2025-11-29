/**
 * Structured Data (JSON-LD) Generators
 * =====================================
 * Generates Schema.org compliant structured data for SEO.
 *
 * All schemas follow Google Search Central guidelines:
 * https://developers.google.com/search/docs/appearance/structured-data
 *
 * Validated against: https://search.google.com/test/rich-results
 */

import { SITE } from "@/config";

/**
 * Publisher organization schema (reusable across posts)
 */
export interface PublisherSchema {
  "@type": "Organization";
  name: string;
  url: string;
  logo?: {
    "@type": "ImageObject";
    url: string;
    width?: number;
    height?: number;
  };
}

/**
 * Author person schema
 */
export interface AuthorSchema {
  "@type": "Person";
  name: string;
  url?: string;
}

/**
 * BlogPosting schema for individual articles
 * Enables Article rich snippets in SERP
 */
export interface BlogPostingSchema {
  "@context": "https://schema.org";
  "@type": "BlogPosting";
  headline: string;
  description: string;
  image: string | string[];
  datePublished: string;
  dateModified?: string;
  author: AuthorSchema | AuthorSchema[];
  publisher: PublisherSchema;
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  wordCount?: number;
  articleSection?: string[];
  keywords?: string;
  inLanguage?: string;
  [key: string]: unknown; // Index signature for Record<string, unknown> compatibility
}

/**
 * BreadcrumbList schema for navigation
 * Enables Breadcrumb rich snippets in SERP
 */
export interface BreadcrumbSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }>;
  [key: string]: unknown; // Index signature for Record<string, unknown> compatibility
}

/**
 * Person schema for author/profile pages
 * Enables Person knowledge panel features
 */
export interface PersonSchema {
  "@context": "https://schema.org";
  "@type": "Person";
  name: string;
  url?: string;
  image?: string;
  jobTitle?: string;
  description?: string;
  sameAs?: string[];
  worksFor?: {
    "@type": "Organization";
    name: string;
    url?: string;
  };
  [key: string]: unknown; // Index signature for Record<string, unknown> compatibility
}

/**
 * WebSite schema for the homepage
 * Enables Sitelinks Search Box in SERP
 */
export interface WebSiteSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description: string;
  inLanguage: string;
  author: AuthorSchema;
  publisher: PublisherSchema;
  [key: string]: unknown; // Index signature for Record<string, unknown> compatibility
}

// =============================================================================
// GENERATOR FUNCTIONS
// =============================================================================

/**
 * Get the default publisher schema
 */
export function getPublisher(siteUrl: string): PublisherSchema {
  return {
    "@type": "Organization",
    name: SITE.title,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/favicon.svg`,
      width: 512,
      height: 512,
    },
  };
}

/**
 * Get author schema
 */
export function getAuthor(
  name: string = SITE.author,
  url?: string
): AuthorSchema {
  return {
    "@type": "Person",
    name,
    ...(url && { url }),
  };
}

/**
 * Generate BlogPosting structured data for a blog post
 *
 * @example
 * generateBlogPostingSchema({
 *   title: "My Post",
 *   description: "A great post...",
 *   imageUrl: "https://example.com/og.jpg",
 *   datePublished: new Date(),
 *   pageUrl: "https://example.com/en/posts/my-post",
 *   siteUrl: "https://example.com",
 * })
 */
export function generateBlogPostingSchema(options: {
  title: string;
  description: string;
  imageUrl: string;
  datePublished: Date;
  dateModified?: Date | null;
  authorName?: string;
  authorUrl?: string;
  pageUrl: string;
  siteUrl: string;
  wordCount?: number;
  tags?: string[];
  locale?: string;
}): BlogPostingSchema {
  const {
    title,
    description,
    imageUrl,
    datePublished,
    dateModified,
    authorName = SITE.author,
    authorUrl = SITE.profile,
    pageUrl,
    siteUrl,
    wordCount,
    tags,
    locale = "en",
  } = options;

  // Truncate headline to 110 chars (Google recommendation)
  const headline = title.length > 110 ? `${title.slice(0, 107)}...` : title;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    description: description.slice(0, 160), // Meta description length
    image: imageUrl,
    datePublished: datePublished.toISOString(),
    ...(dateModified && { dateModified: dateModified.toISOString() }),
    author: getAuthor(authorName, authorUrl),
    publisher: getPublisher(siteUrl),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    ...(wordCount && { wordCount }),
    ...(tags?.length && { keywords: tags.join(", ") }),
    inLanguage: locale,
  };
}

/**
 * Generate BreadcrumbList structured data
 *
 * @example
 * generateBreadcrumbSchema([
 *   { name: "Home", url: "https://example.com/en/" },
 *   { name: "Posts", url: "https://example.com/en/posts/" },
 *   { name: "My Post" }, // Current page (no URL)
 * ])
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url?: string }>
): BreadcrumbSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };
}

/**
 * Generate Person structured data for profile/about pages
 */
export function generatePersonSchema(options: {
  name: string;
  url?: string;
  imageUrl?: string;
  jobTitle?: string;
  description?: string;
  socialLinks?: string[];
  employer?: { name: string; url?: string };
}): PersonSchema {
  const { name, url, imageUrl, jobTitle, description, socialLinks, employer } =
    options;

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    ...(url && { url }),
    ...(imageUrl && { image: imageUrl }),
    ...(jobTitle && { jobTitle }),
    ...(description && { description }),
    ...(socialLinks?.length && { sameAs: socialLinks }),
    ...(employer && {
      worksFor: {
        "@type": "Organization",
        name: employer.name,
        ...(employer.url && { url: employer.url }),
      },
    }),
  };
}

/**
 * Generate WebSite structured data for homepage
 * Enables Sitelinks Search Box feature
 */
export function generateWebSiteSchema(options: {
  siteUrl: string;
  locale?: string;
}): WebSiteSchema {
  const { siteUrl, locale = "en" } = options;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.title,
    url: siteUrl,
    description: SITE.desc,
    inLanguage: locale,
    author: getAuthor(SITE.author, SITE.profile),
    publisher: getPublisher(siteUrl),
  };
}

/**
 * Combine multiple schemas into a single graph
 * Useful for pages with multiple schema types
 */
export function combineSchemas(
  ...schemas: Array<Record<string, unknown>>
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": schemas.map(schema => {
      // Remove @context from individual schemas when combining
      const { "@context": _, ...rest } = schema;
      return rest;
    }),
  };
}
