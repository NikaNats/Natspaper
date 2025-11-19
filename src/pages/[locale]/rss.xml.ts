import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { SITE } from "@/config";
import { contentRepo } from "@/utils/content.repository";
import {
  sanitizeMarkdownUrls,
  escapeHtml,
  sanitizeDescription,
} from "@/utils/rss";

export const GET: APIRoute = async ({ params, site }) => {
  const locale = params.locale as "en" | "ka";
  const posts = await contentRepo.getPostsByLocale(locale);

  // REFACTORED: Use the global setting variable instead of magic number 50
  const recentPosts = posts.slice(0, SITE.rssLimit);

  return rss({
    title: `${SITE.title} - ${locale.toUpperCase()}`,
    description: SITE.desc,
    site: site!,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
    },
    items: recentPosts.map(post => {
      const slug = String(post.id).split("/").pop();

      return {
        link: `/${locale}/posts/${slug}`,
        title: escapeHtml(post.data.title),
        description: `<![CDATA[${sanitizeMarkdownUrls(
          sanitizeDescription(post.data.description)
        )}]]>`,
        pubDate: new Date(post.data.modDatetime ?? post.data.pubDatetime),
      };
    }),
  });
};

export function getStaticPaths() {
  return [{ params: { locale: "en" } }, { params: { locale: "ka" } }];
}
