import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { SITE, FEATURES } from "@/config";
import { SUPPORTED_LANGS, LOCALE_CODES, type Lang } from "@/i18n/config";
import { PostRepository } from "@/utils/post/repository";
import { getPostUrl } from "@/utils/post";
import {
  sanitizeMarkdownUrls,
  escapeHtml,
  sanitizeDescription,
} from "@/utils/rss";

export function getStaticPaths() {
  return SUPPORTED_LANGS.map(locale => ({ params: { locale } }));
}

export const GET: APIRoute = async ({ params, site }) => {
  const locale = (params.locale as Lang) || "en";
  const posts = await PostRepository.getByLocale(locale);
  const recentPosts = posts.slice(0, FEATURES.rssLimit);

  const siteUrl = site
    ? site.href.replace(/\/$/, "")
    : SITE.website.replace(/\/$/, "");
  const feedUrl = `${siteUrl}/${locale}/rss.xml`;
  const langCode = LOCALE_CODES[locale] || locale;

  return rss({
    title: `${SITE.title} - ${locale.toUpperCase()}`,
    description: SITE.desc,
    site: siteUrl,
    customData: `
      <language>${langCode}</language>
      <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
      <atom:link href="${siteUrl}/${locale}/atom.xml" rel="alternate" type="application/atom+xml" />
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    `,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
    },
    items: recentPosts.map(post => {
      const postSlug =
        String(post.id)
          .split("/")
          .pop()
          ?.replace(/\.(md|mdx)$/, "") || post.slug;
      let displayTitle = post.data.title;
      if (post.data.series) {
        displayTitle = `[${post.data.series.title}, Part ${post.data.series.order}] ${displayTitle}`;
      }

      return {
        link: getPostUrl(locale, postSlug),
        title: escapeHtml(displayTitle),
        description: `<![CDATA[${sanitizeMarkdownUrls(
          sanitizeDescription(post.data.description)
        )}]]>`,
        pubDate: new Date(post.data.pubDatetime),
        categories: post.data.tags || [],
        author: post.data.author || SITE.author,
      };
    }),
  });
};
