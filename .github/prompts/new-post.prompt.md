---
mode: "agent"
tools: ["filesystem", "sequential-thinking"]
description: "Scaffold a new blog post with correct frontmatter, locale routing and i18n wiring."
---

# New Blog Post Scaffold

You are assisting with creating a new blog post for the Natspaper platform.

## Required Information

Ask the user for the following if not already provided:

1. **Post slug** (URL-safe, kebab-case, e.g. `my-new-post`)
2. **Primary locale** (`en`, `ka`, or other supported locale)
3. **Title** in the primary locale
4. **Description** (1–2 sentences for SEO meta)
5. **Tags** (comma-separated list)
6. **Featured?** (yes/no)
7. **Series name** (optional)

## Steps to Execute

1. Verify `src/content/blog/` exists and inspect existing posts for frontmatter shape.
2. Read `src/content.config.ts` to confirm the schema fields.
3. Read `src/i18n/index.ts` to understand locale codes.
4. Create the post file at: `src/content/blog/<locale>/<slug>.md`
5. Generate frontmatter:
   ```md
   ---
   title: "<title>"
   description: "<description>"
   pubDate: "<YYYY-MM-DD>"
   locale: "<locale>"
   tags: [<tags>]
   featured: <true|false>
   draft: false
   ---
   ```
6. Add placeholder body with H2 section stubs.
7. If series is specified, verify the series name matches existing series in the content collection.

## Quality Checklist

- [ ] Slug is kebab-case, no special characters
- [ ] `pubDate` is today's date in ISO 8601 format
- [ ] Description is 120–160 characters for SEO
- [ ] Tags array contains at least one entry
- [ ] File encoding is UTF-8
- [ ] Frontmatter matches the Zod schema in `content.config.ts`

After creating the file, print the full relative path and open it.
