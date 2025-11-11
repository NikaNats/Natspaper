import { defineCollection, z } from "astro:content";
import { siteConfig } from "./site.config"; // Import from the pure metadata file.

const blog = defineCollection({
  // 'content' is appropriate for MD/MDX files
  type: "content",
  schema: z.object({
    // REFACTORED: The default value is now taken from a pure, non-circular dependency.
    author: z.string().default(siteConfig.author),
    pubDatetime: z.coerce.date(),
    modDatetime: z.coerce.date().optional().nullable(),
    title: z.string(),
    featured: z.boolean().optional(),
    draft: z.boolean().optional(),
    tags: z.array(z.string()).default(["others"]),
    // Keep ogImage as string (path/URL) for compatibility with current types
    ogImage: z.string().optional(),
    description: z.string(),
    canonicalURL: z.string().optional(),
    hideEditPost: z.boolean().optional(),
    timezone: z.string().optional(),
  }),
});

export const collections = { blog };
