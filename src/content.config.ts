import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      author: z.string().default("Nika Natsvlishvili"),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string().max(100, "Title is too long for SEO"),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image()
        .refine(img => img.width >= 1200 && img.height >= 630, {
          message: "OpenGraph image must be at least 1200x630 pixels",
        })
        .optional(),
      description: z.string().min(10).max(160),
      canonicalURL: z.string().url().optional(),
      timezone: z.string().optional(),
      hideEditPost: z.boolean().optional(),
    }),
});

export const collections = { blog };
