/**
 * UI Strings Dictionary for Internationalization (i18n)
 *
 * This file defines all hardcoded UI text that appears in components.
 * Each language should have complete translations for all keys.
 *
 * IMPORTANT: When adding new keys, add them to BOTH en and ka objects.
 * The type system will catch missing keys at compile time.
 */

export const ui = {
  en: {
    // Navigation
    "nav.posts": "Posts",
    "nav.tags": "Tags",
    "nav.archives": "Archives",
    "nav.search": "Search",
    "nav.openMenu": "Open Menu",
    "nav.closeMenu": "Close Menu",
    "nav.mainMenu": "Main Menu",
    "nav.home": "Home",
    "nav.skipToContent": "Skip to main content",

    // Footer
    "footer.copyright": "All rights reserved.",

    // Search
    "search.placeholder": "Search any article...",

    // Post
    "post.goBack": "Go back",
    "post.updatedOn": "Updated on",
    "post.updated": "Updated:",
    "post.readingTime": "min read",
    "post.shareOn": "Share on",
    "post.shareThisPost": "Share this post:",
    "post.featured": "Featured",
    "post.englishOnly": "English only",

    // Navigation helpers
    "nav.previousPost": "← Previous",
    "nav.nextPost": "Next →",
    "nav.previousArticle": "Previous Article",
    "nav.nextArticle": "Next Article",

    // Tag page
    "tags.allTags": "All Tags",
    "tags.postsWithTag": "Posts with tag",
    "tags.topics": "Topics",

    // Archives
    "archives.title": "Archives",
    "archives.byYear": "Posts by Year",

    // Pagination
    "pagination.previous": "← Previous",
    "pagination.next": "Next →",
    "pagination.prev": "Prev",
    "pagination.pageOf": "Page {current} of {total}",
    "pagination.previousPage": "Previous Page",
    "pagination.nextPage": "Next Page",

    // Comments
    "comments.discussion": "Discussion",

    // Hero / Index page
    "hero.featuredPosts": "Featured Posts",

    // Dates
    "date.format.short": "MMM D, YYYY",
    "date.format.long": "MMMM D, YYYY",

    // Accessibility
    "a11y.postTags": "Post tags",
    "a11y.tableOfContents": "Table of contents",
    "a11y.postNavigation": "Post Navigation",
  },
  ka: {
    // Navigation - keeping "post" and "tag" in English
    "nav.posts": "Posts",
    "nav.tags": "Tags",
    "nav.archives": "არქივი",
    "nav.search": "ძებნა",
    "nav.openMenu": "მენიუს გახსნა",
    "nav.closeMenu": "მენიუს დახურვა",
    "nav.mainMenu": "მთავარი მენიუ",
    "nav.home": "მთავარი",
    "nav.skipToContent": "ძირითად კონტენტზე გადასვლა",

    // Footer
    "footer.copyright": "ყველა უფლება დაცულია.",

    // Search
    "search.placeholder": "მოძებნე სტატია...",

    // Post
    "post.goBack": "უკან დაბრუნება",
    "post.updatedOn": "განახლებული",
    "post.updated": "განახლდა:",
    "post.readingTime": "წთ კითხვა",
    "post.shareOn": "გაზიარება",
    "post.shareThisPost": "გააზიარე ეს პოსტი:",
    "post.featured": "გამორჩეული",
    "post.englishOnly": "მხოლოდ ინგლისურად",

    // Navigation helpers
    "nav.previousPost": "← წინა",
    "nav.nextPost": "შემდეგი →",
    "nav.previousArticle": "წინა სტატია",
    "nav.nextArticle": "შემდეგი სტატია",

    // Tag page
    "tags.allTags": "ყველა თეგი",
    "tags.postsWithTag": "პოსტები თეგით",
    "tags.topics": "თემები",

    // Archives
    "archives.title": "არქივი",
    "archives.byYear": "პოსტები წლების მიხედვით",

    // Pagination
    "pagination.previous": "← წინა",
    "pagination.next": "შემდეგი →",
    "pagination.prev": "წინა",
    "pagination.pageOf": "გვერდი {current} / {total}",
    "pagination.previousPage": "წინა გვერდი",
    "pagination.nextPage": "შემდეგი გვერდი",

    // Comments
    "comments.discussion": "განხილვა",

    // Hero / Index page
    "hero.featuredPosts": "გამორჩეული პოსტები",

    // Dates
    "date.format.short": "D MMM, YYYY",
    "date.format.long": "D MMMM, YYYY",

    // Accessibility
    "a11y.postTags": "პოსტის თეგები",
    "a11y.tableOfContents": "სარჩევი",
    "a11y.postNavigation": "პოსტებში ნავიგაცია",
  },
} as const;

export type UIKey = keyof typeof ui.en;

/**
 * Type guard to ensure ka dictionary has all keys from en
 * This will cause a compile-time error if keys are missing
 */
type ValidateTranslations = {
  [K in UIKey]: (typeof ui.ka)[K] extends string ? true : never;
};

// This will error at compile time if ka is missing any keys from en
const _validateKa: ValidateTranslations = {} as ValidateTranslations;
