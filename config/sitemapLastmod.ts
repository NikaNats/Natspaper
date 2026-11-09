import fs from "node:fs";
import path from "node:path";

/**
 * Sitemap `<lastmod>` resolution for blog posts.
 *
 * Google and Bing only trust `lastmod` when it is "consistently and verifiably
 * accurate"; stamping every URL with the build time teaches crawlers to ignore
 * it. So:
 *   - post URLs get `modDatetime ?? pubDatetime` from frontmatter — the same
 *     value rendered as `article:modified_time`;
 *   - every other URL gets no `lastmod` at all (omitting it is correct when
 *     there is no meaningful content-change date).
 *
 * The sitemap integration runs in the Astro config, outside the content layer,
 * so frontmatter is read directly from disk. Only the two top-level date keys
 * are needed, which keeps this free of a YAML dependency.
 */

const CONTENT_DIR = path.resolve("src/content/blog");
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

function readDateKey(frontmatter: string, key: string): Date | undefined {
  const match = new RegExp(`^${key}:\\s*["']?([^"'\\r\\n#]+)`, "m").exec(
    frontmatter
  );
  const raw = match?.[1]?.trim();
  if (!raw || raw === "null" || raw === "~") return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.mdx?$/.test(entry.name) ? [full] : [];
  });
}

/**
 * Build a `"{locale}/{slug}"` → last-modified date map, where a locale without
 * its own translation inherits the date of the version its page renders
 * (DEFAULT_LANG first, then any) — mirroring `getByLocaleWithFallback`.
 */
export function buildPostLastmodMap(
  locales: readonly string[],
  defaultLocale: string,
  contentDir: string = CONTENT_DIR
): Map<string, Date> {
  // slug → locale → date
  const bySlug = new Map<string, Map<string, Date>>();

  for (const file of walk(contentDir)) {
    const rel = path.relative(contentDir, file).split(path.sep);
    const [locale, ...rest] = rel;
    if (!locale || rest.length === 0) continue;
    const slug = rest.join("/").replace(/\.mdx?$/, "").split("/").pop();
    if (!slug) continue;

    const fm = FRONTMATTER.exec(fs.readFileSync(file, "utf8"))?.[1];
    if (!fm) continue;
    const date = readDateKey(fm, "modDatetime") ?? readDateKey(fm, "pubDatetime");
    if (!date) continue;

    const versions = bySlug.get(slug) ?? new Map<string, Date>();
    versions.set(locale, date);
    bySlug.set(slug, versions);
  }

  const result = new Map<string, Date>();
  for (const [slug, versions] of bySlug) {
    const fallback =
      versions.get(defaultLocale) ?? versions.values().next().value;
    for (const locale of locales) {
      const date = versions.get(locale) ?? fallback;
      if (date) result.set(`${locale}/${slug}`, date);
    }
  }
  return result;
}

/**
 * Resolve `lastmod` for a sitemap URL, or `undefined` for non-post pages.
 * Matches `/{locale}/posts/{slug}/` but not paginated `/{locale}/posts/2/`.
 */
export function lastmodForUrl(
  url: string,
  map: ReadonlyMap<string, Date>
): string | undefined {
  const match = /\/([a-z]{2}(?:-[A-Za-z]+)?)\/posts\/([^/]+)\/?$/.exec(
    new URL(url).pathname
  );
  if (!match) return undefined;
  return map.get(`${match[1]}/${match[2]}`)?.toISOString();
}
