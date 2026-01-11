import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { SITE, FEATURES } from "@/config";
import { SUPPORTED_LANGS, type Lang } from "@/i18n/config"; // SSOT
import { PostRepository } from "@/utils/post/repository";
import {
  sanitizeMarkdownUrls,
  escapeHtml,
  sanitizeDescription,
} from "@/utils/rss";

export const GET: APIRoute = async ({ params, site }) => {
  const locale = params.locale as Lang;
  const posts = await PostRepository.getByLocale(locale);

  // REFACTORED: Use the global setting variable instead of magic number 50
  const recentPosts = posts.slice(0, FEATURES.rssLimit);

  return rss({
    title: `${SITE.title} - ${locale.toUpperCase()}`,
    description: SITE.desc,
    site: site!,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
    },
    items: recentPosts.map(post => {
      let displayTitle = post.data.title;
      if (post.data.series) {
        // Format: "[Series Name, Part 1] Article Title"
        displayTitle = `[${post.data.series.title}, Part ${post.data.series.order}] ${displayTitle}`;
      }
      
      return {
        link: `/${locale}/posts/${String(post.id).split("/").pop()}`,
        title: escapeHtml(displayTitle),
        description: `<![CDATA[${sanitizeMarkdownUrls(
          sanitizeDescription(post.data.description)
        )}]]>`,
        pubDate: new Date(post.data.modDatetime ?? post.data.pubDatetime),
      };
    }),
  });
};

// REFACTORED: Generate paths dynamically from config
export function getStaticPaths() {
  return SUPPORTED_LANGS.map(locale => ({ params: { locale } }));
}
