import { defineCollection, z } from "astro:content";
import { SITE } from "@/config";

const blog = defineCollection({
  // 'content' is appropriate for MD/MDX files
  type: "content",
  schema: z.object({
    author: z.string().default(SITE.author),
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
