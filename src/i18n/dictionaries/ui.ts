/**
 * UI Strings Dictionary for Internationalization (i18n)
 *
 * This file defines all hardcoded UI text that appears in components.
 * Each language should have complete translations for all keys.
 */

export const ui = {
  en: {
    // Navigation
    "nav.posts": "Posts",
    "nav.tags": "Tags",
    "nav.archives": "Archives",
    "nav.search": "Search",

    // Footer
    "footer.copyright": "All rights reserved.",

    // Search
    "search.placeholder": "Search any article...",

    // Post
    "post.goBack": "Go back",
    "post.updatedOn": "Updated on",
    "post.readingTime": "min read",
    "post.shareOn": "Share on",

    // Navigation helpers
    "nav.previousPost": "← Previous",
    "nav.nextPost": "Next →",

    // Tag page
    "tags.allTags": "All Tags",
    "tags.postsWithTag": "Posts with tag",

    // Archives
    "archives.title": "Archives",
    "archives.byYear": "Posts by Year",

    // Pagination
    "pagination.previous": "← Previous",
    "pagination.next": "Next →",
  },
  ka: {
    // Navigation - keeping "post" and "tag" in English
    "nav.posts": "Posts",
    "nav.tags": "Tags",
    "nav.archives": "არქივი",
    "nav.search": "ძებნა",

    // Footer
    "footer.copyright": "ყველა უფლება დაცულია.",

    // Search
    "search.placeholder": "მოძებნე სტატია...",

    // Post
    "post.goBack": "უკან დაბრუნება",
    "post.updatedOn": "განახლებული",
    "post.readingTime": "წთ კითხვა",
    "post.shareOn": "გაზიარება",

    // Navigation helpers
    "nav.previousPost": "← წინა",
    "nav.nextPost": "შემდეგი →",

    // Tag page
    "tags.allTags": "All Tags",
    "tags.postsWithTag": "Posts with tag",

    // Archives
    "archives.title": "არქივი",
    "archives.byYear": "Posts by Year",

    // Pagination
    "pagination.previous": "← წინა",
    "pagination.next": "შემდეგი →",
  },
} as const;

export type UIKey = keyof typeof ui.en;
