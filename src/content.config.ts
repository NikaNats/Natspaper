import { defineCollection, z } from "astro:content";
import { siteConfig } from "./site.config";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    author: z.string().default(siteConfig.author),
    pubDatetime: z.coerce.date(),
    modDatetime: z.coerce.date().optional().nullable(),

    // IMPROVEMENT: Enforce max length for titles for SEO/Social Card safety
    title: z
      .string()
      .max(100, "Title should be under 100 characters for optimal SEO"),

    featured: z.boolean().optional(),
    draft: z.boolean().optional(),
    tags: z.array(z.string()).default(["others"]),
    ogImage: z.string().optional(),

    // IMPROVEMENT: Enforce description length (SEO snippet optimization)
    description: z
      .string()
      .min(50, "Description too short for SEO")
      .max(160, "Description too long for SEO snippets"),

    canonicalURL: z.string().url().optional(), // Ensure it's a valid URL format
    hideEditPost: z.boolean().optional(),
    timezone: z.string().optional(),
  }),
});

export const collections = { blog };
