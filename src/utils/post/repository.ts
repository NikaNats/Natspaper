import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { slugifyStr } from "../core/slugify";

// Encapsulate sorting/filtering logic here
export const PostRepository = {
  getAll: async (): Promise<CollectionEntry<"blog">[]> => {
    return await getCollection("blog", ({ data }) => !data.draft);
  },

  getSorted: async (): Promise<CollectionEntry<"blog">[]> => {
    const posts = await PostRepository.getAll();
    return posts.sort(
      (a, b) =>
        Math.floor(new Date(b.data.pubDatetime).getTime() / 1000) -
        Math.floor(new Date(a.data.pubDatetime).getTime() / 1000)
    );
  },

  getByLocale: async (locale: string): Promise<CollectionEntry<"blog">[]> => {
    const posts = await PostRepository.getSorted();
    return posts.filter(post => post.id.startsWith(`${locale}/`));
  },

  getByTag: async (tag: string): Promise<CollectionEntry<"blog">[]> => {
    const posts = await PostRepository.getSorted();
    return posts.filter(post =>
      post.data.tags.map(t => slugifyStr(t)).includes(tag)
    );
  },

  getFeatured: async (): Promise<CollectionEntry<"blog">[]> => {
    const posts = await PostRepository.getSorted();
    return posts.filter(post => post.data.featured);
  },
};
