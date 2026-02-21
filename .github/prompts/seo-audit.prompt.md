---
mode: "agent"
tools: ["filesystem", "sequential-thinking"]
description: "Audit SEO, canonicalization, robots directives, and i18n completeness."
---

# SEO & i18n Audit

Perform a comprehensive SEO and i18n audit of the Natspaper blog.

## Part 1 — i18n Completeness

1. Read `src/i18n/` directory to list all locale files.
2. For each locale, compare keys against the base locale (`en`).
3. Report:
   - Missing keys per locale
   - Keys present in non-base locale but absent in `en` (orphan keys)
   - Keys with identical values across locales (may indicate untranslated content)

## Part 2 — Routing & Canonical URLs

For each page in `src/pages/`:

1. Verify `getStaticPaths` returns entries for **all supported locales**.
2. Verify the `<link rel="canonical">` points to the primary locale URL.
3. Verify `<link rel="alternate" hreflang="...">` tags list all locale variants.
4. Check for fallback pages: do they emit `<meta name="robots" content="noindex, follow">`?

## Part 3 — Meta Tags

Check `src/components/features/Seo.astro`:

- [ ] `<title>` is unique per page (not just the site name)
- [ ] `<meta name="description">` is 120–160 characters
- [ ] `<meta property="og:image">` points to a valid OG image URL
- [ ] `<meta name="robots">` is `noindex, follow` for fallback/draft pages
- [ ] `<link rel="canonical">` is present and correct on all pages

## Part 4 — Sitemap

Check `dist/sitemap-*.xml` (after build):

- [ ] All published, non-draft posts appear
- [ ] Fallback locale pages are excluded (or marked `<priority>0.0</priority>`)
- [ ] `<lastmod>` dates are present

## Part 5 — Structured Data (JSON-LD)

Check for `<script type="application/ld+json">` in post pages:

- [ ] `@type: "BlogPosting"` present
- [ ] `author`, `datePublished`, `headline`, `image` populated
- [ ] `inLanguage` matches the post locale

## Part 6 — Performance SEO Signals

Run `pnpm build` then check `dist/`:

- [ ] All HTML files ≥ 2 KB (verify-build threshold)
- [ ] No render-blocking resources (`<script>` without `defer` or `async`)
- [ ] Images use modern formats (WebP/AVIF via Astro Image)
- [ ] `<img>` elements have explicit `width` and `height` to prevent CLS

## Output Format

```
## Summary
- Locales audited: <list>
- Missing i18n keys: <count>
- Pages with missing canonical: <count>
- Pages with missing hreflang: <count>
- Issues found: <total count>

## Issues
[SEVERITY] <File/URL> — <Issue> — <Recommendation>
```
