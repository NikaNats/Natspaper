import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { SITE, FEATURES, SOCIALS } from "@/config";
import { SUPPORTED_LANGS, LOCALE_CODES, type Lang } from "@/i18n/config";
import { PostRepository } from "@/utils/post/repository";
import { getPostUrl } from "@/utils/post";
import { escapeHtml, toPlainText } from "@/utils/rss";

export function getStaticPaths() {
  return SUPPORTED_LANGS.map(locale => ({ params: { locale } }));
}

/**
 * Escaping contract: `@astrojs/rss` serializes with fast-xml-parser, which
 * entity-encodes every text value. Item fields are therefore passed as PLAIN
 * text — pre-escaping (or wrapping in a CDATA string) double-encodes and feed
 * readers display raw `&amp;` / `<![CDATA[` text. Only `customData`, which is
 * parsed as XML, is escaped here.
 */
export const GET: APIRoute = async ({ params, site }) => {
  const locale = (params.locale as Lang) || "en";
  const posts = await PostRepository.getByLocale(locale);
  const recentPosts = posts.slice(0, FEATURES.rssLimit);

  const siteUrl = site
    ? site.href.replace(/\/$/, "")
    : SITE.website.replace(/\/$/, "");
  const feedUrl = `${siteUrl}/${locale}/rss.xml`;
  const langCode = LOCALE_CODES[locale] || locale;

  // RSS 2.0 <author> must be an email address ("email (Name)"). The display
  // name always goes in <dc:creator> (Dublin Core), the convention readers
  // use when no email is published.
  const authorEmail =
    SOCIALS.find(s => s.name.toLowerCase() === "mail")?.href.replace(
      "mailto:",
      ""
    ) || "";

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
      dc: "http://purl.org/dc/elements/1.1/",
    },
    items: recentPosts.map(post => {
      const authorName = post.data.author || SITE.author;
      let displayTitle = post.data.title;
      if (post.data.series) {
        displayTitle = `[${post.data.series.title}, Part ${post.data.series.order}] ${displayTitle}`;
      }

      return {
        link: getPostUrl(locale, post.slug),
        title: displayTitle,
        description: toPlainText(post.data.description),
        pubDate: new Date(post.data.pubDatetime),
        categories: post.data.tags || [],
        ...(authorEmail && { author: `${authorEmail} (${authorName})` }),
        customData: `<dc:creator>${escapeHtml(authorName)}</dc:creator>`,
      };
    }),
  });
};
