/**
 * Content Collection Configuration
 * =================================
 * Defines the schema for all content collections using Zod.
 * This is the single source of truth for frontmatter validation.
 *
 * Schema Design Principles:
 * - Explicit defaults prevent undefined values in components
 * - SEO constraints (title length, description range) are enforced here
 * - Optional fields use `.optional()` with sensible defaults where appropriate
 * - Image validation ensures OG images meet social media requirements
 *
 * @see https://docs.astro.build/en/guides/content-collections/
 */

import { defineCollection, z } from "astro:content";
import { SITE } from "./config";

/**
 * Reusable Zod schemas for common patterns
 * Centralizing these prevents duplication and ensures consistency
 */
const schemas = {
  /** Non-empty trimmed string */
  nonEmptyString: z.string().trim().min(1, "Cannot be empty"),

  /** Valid slug format (lowercase, hyphens, no spaces) */
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only"
    ),

  /** URL that must be absolute */
  absoluteUrl: z.string().url("Must be a valid absolute URL"),

  /** IANA timezone string */
  timezone: z.string().refine(
    tz => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    },
    { message: "Must be a valid IANA timezone (e.g., 'America/New_York')" }
  ),

  /** Reference schema for academic citations */
  reference: z.object({
    id: z
      .string()
      .describe("Internal ID to match in-text citations (e.g., 'hoare1974')"),
    title: z.string(),
    author: z.string(),
    year: z.number().int(),
    journal: z.string().optional(),
    url: z.string().url().optional(),
    doi: z
      .string()
      .optional()
      .describe("Digital Object Identifier for academic papers"),
  }),
} as const;

/**
 * Blog Collection Schema
 *
 * Validates frontmatter for all blog posts.
 * All fields are documented for contributor clarity.
 */
const blog = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      /**
       * Post author name
       * @default Site author from config
       */
      author: z.string().default(SITE.author),

      /**
       * Publication date (required for sorting and display)
       * Must be a valid date that can be parsed
       */
      pubDatetime: z.date({
        required_error: "Publication date is required",
        invalid_type_error: "Publication date must be a valid date",
      }),

      /**
       * Last modification date (shown if different from pubDatetime)
       * @optional
       */
      modDatetime: z.date().optional().nullable(),

      /**
       * Post title - constrained for SEO best practices
       * Google truncates titles > 60 chars, we allow up to 100 for flexibility
       */
      title: z
        .string()
        .min(5, "Title must be at least 5 characters")
        .max(100, "Title exceeds 100 characters (SEO impact)"),

      /**
       * Featured posts appear in hero/highlighted sections
       * @default false
       */
      featured: z.boolean().default(false),

      /**
       * Draft posts are excluded from production builds
       * @default false
       */
      draft: z.boolean().default(false),

      /**
       * Tags for categorization and filtering
       * At least one tag is recommended for discoverability
       * @default ["others"]
       */
      tags: z
        .array(z.string().trim().toLowerCase())
        .min(1, "At least one tag is required")
        .default(["others"]),

      /**
       * Custom OpenGraph image for social sharing
       * Must meet minimum dimensions for proper display on social platforms
       * @optional Falls back to auto-generated OG image
       */
      ogImage: image()
        .refine(img => img.width >= 1200 && img.height >= 630, {
          message:
            "OpenGraph image must be at least 1200x630 pixels for social media",
        })
        .optional(),

      /**
       * Meta description for SEO
       * Google shows ~155-160 chars in SERP, minimum 10 for meaningful content
       */
      description: z
        .string()
        .min(10, "Description must be at least 10 characters")
        .max(
          160,
          "Description exceeds 160 characters (will be truncated in SERP)"
        ),

      /**
       * Canonical URL for cross-posted content
       * Use when republishing content from another source
       * @optional
       */
      canonicalURL: schemas.absoluteUrl.optional(),

      /**
       * Override timezone for date display
       * Useful for posts about events in specific timezones
       * @optional Falls back to site timezone
       */
      timezone: schemas.timezone.optional(),

      /**
       * Hide the "Edit this page" link for this specific post
       * Useful for posts that shouldn't be community-edited
       * @default false
       */
      hideEditPost: z.boolean().default(false),

      /**
       * Series information for grouping related posts
       * @optional
       */
      series: z
        .object({
          id: z
            .string()
            .describe(
              "Unique identifier for the series (e.g., 'system-design')"
            ),
          order: z
            .number()
            .int()
            .positive()
            .describe("The sequence number in the series"),
          title: z.string().describe("The display name of the series group"),
        })
        .optional(),

      /**
       * Academic references for citations
       * Structured data for proper SEO and semantic markup
       * @optional
       */
      references: z.array(schemas.reference).optional(),
    }),
});

export const collections = { blog };

/**
 * Type exports for use in components
 * Note: For proper type inference, use CollectionEntry<"blog"> from astro:content
 * This provides the complete type including slug, id, and rendered content.
 *
 * @example
 * import type { CollectionEntry } from "astro:content";
 * const post: CollectionEntry<"blog"> = await getEntry("blog", "my-post");
 * const { title, description } = post.data; // Fully typed frontmatter
 */
