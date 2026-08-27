import type { APIRoute } from "astro";
import { SITE, FEATURES, SOCIALS } from "@/config";
import { SUPPORTED_LANGS, type Lang } from "@/i18n/config";
import { PostRepository } from "@/utils/post/repository";
import { getPostUrl } from "@/utils/post";
import { escapeHtml, sanitizeDescription } from "@/utils/rss";

export function getStaticPaths() {
  return SUPPORTED_LANGS.map(locale => ({ params: { locale } }));
}

/**
 * Serializes a Date object to a strict RFC 3339 timestamp (RFC 4287 Section 3.3).
 */
function toRFC3339(date: Date): string {
  return date.toISOString();
}

/**
 * Generates a persistent, globally unique Atom ID according to RFC 4287 Section 4.2.6.
 * Format: tag:domain,year:locale/posts/slug
 */
function generateAtomId(
  siteUrl: string,
  locale: string,
  slug: string,
  date: Date
): string {
  try {
    const host = new URL(siteUrl).hostname;
    const year = date.getUTCFullYear();
    return `tag:${host},${year}:${locale}/posts/${slug}`;
  } catch {
    return `${siteUrl.replace(/\/$/, "")}/${locale}/posts/${slug}`;
  }
}

export const GET: APIRoute = async ({ params, site }) => {
  const locale = (params.locale as Lang) || "en";
  const posts = await PostRepository.getByLocale(locale);
  const recentPosts = posts.slice(0, FEATURES.rssLimit);

  const siteUrl = site
    ? site.href.replace(/\/$/, "")
    : SITE.website.replace(/\/$/, "");
  const feedUrl = `${siteUrl}/${locale}/atom.xml`;
  const alternateUrl = `${siteUrl}/${locale}/`;
  const feedUpdated = recentPosts[0]
    ? toRFC3339(
        new Date(
          recentPosts[0].data.modDatetime ?? recentPosts[0].data.pubDatetime
        )
      )
    : toRFC3339(new Date());

  const authorEmail =
    SOCIALS.find(s => s.name.toLowerCase() === "mail")?.href.replace(
      "mailto:",
      ""
    ) || "";
  const authorProfile = SITE.profile || siteUrl;

  const entriesXml = recentPosts
    .map(post => {
      const postSlug =
        String(post.id)
          .split("/")
          .pop()
          ?.replace(/\.(md|mdx)$/, "") || post.slug;
      const postUrl = `${siteUrl}${getPostUrl(locale, postSlug)}`;
      const publishedAt = new Date(post.data.pubDatetime);
      const updatedAt = new Date(
        post.data.modDatetime ?? post.data.pubDatetime
      );
      const atomId = generateAtomId(siteUrl, locale, postSlug, publishedAt);

      let displayTitle = post.data.title;
      if (post.data.series) {
        displayTitle = `[${post.data.series.title}, Part ${post.data.series.order}] ${displayTitle}`;
      }

      const summaryText = escapeHtml(
        sanitizeDescription(post.data.description)
      );

      const categoriesXml = (post.data.tags || [])
        .map(
          (tag: string) =>
            `<category term="${escapeHtml(tag)}" label="${escapeHtml(tag)}" />`
        )
        .join("\n      ");

      return `  <entry xml:lang="${locale}">
    <title type="text">${escapeHtml(displayTitle)}</title>
    <link rel="alternate" type="text/html" href="${postUrl}" />
    <id>${atomId}</id>
    <published>${toRFC3339(publishedAt)}</published>
    <updated>${toRFC3339(updatedAt)}</updated>
    <author>
      <name>${escapeHtml(post.data.author || SITE.author)}</name>
      <uri>${escapeHtml(authorProfile)}</uri>
    </author>
    <summary type="html">${summaryText}</summary>
    ${categoriesXml}
  </entry>`;
    })
    .join("\n\n");

  const feedXml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${locale}">
  <title type="text">${escapeHtml(SITE.title)} (${locale.toUpperCase()})</title>
  <subtitle type="text">${escapeHtml(SITE.desc)}</subtitle>
  <link rel="self" type="application/atom+xml" href="${feedUrl}" />
  <link rel="alternate" type="text/html" hreflang="${locale}" href="${alternateUrl}" />
  <id>${feedUrl}</id>
  <updated>${feedUpdated}</updated>
  <rights>Copyright (c) ${new Date().getFullYear()}, ${escapeHtml(SITE.author)}</rights>
  <generator uri="https://astro.build" version="5.x">Astro / Natspaper</generator>
  <author>
    <name>${escapeHtml(SITE.author)}</name>
    <uri>${escapeHtml(authorProfile)}</uri>
    ${authorEmail ? `<email>${escapeHtml(authorEmail)}</email>` : ""}
  </author>
  <icon>${siteUrl}/favicon.svg</icon>
  <logo>${siteUrl}/${SITE.ogImage}</logo>

${entriesXml}
</feed>`;

  return new Response(feedXml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
};
