import type { CollectionEntry } from "astro:content";
import { slugifyStr } from "./slugify";
import postFilter from "./postFilter";
import { getTranslatedTagName } from "@/i18n/tags";

interface Tag {
  tag: string;
  tagName: string;
}

/**
 * Get unique tags from posts
 *
 * @param posts - Array of blog posts
 * @param locale - Optional locale for tag name translation (e.g., "en", "ka")
 *                If provided, tag names will be translated to the specified language
 * @returns Array of unique tags with slug and display name
 */
const getUniqueTags = (posts: CollectionEntry<"blog">[], locale?: string) => {
  const tags: Tag[] = posts
    .filter(postFilter)
    .flatMap(post => post.data.tags)
    .map(tag => {
      const tagSlug = slugifyStr(tag);
      // If locale is provided, use translated name, otherwise use original tag
      const tagName = locale ? getTranslatedTagName(tagSlug, locale) : tag;
      return { tag: tagSlug, tagName };
    })
    .filter(
      (value, index, self) =>
        self.findIndex(tag => tag.tag === value.tag) === index
    )
    .sort((tagA, tagB) => tagA.tag.localeCompare(tagB.tag));
  return tags;
};

export default getUniqueTags;
