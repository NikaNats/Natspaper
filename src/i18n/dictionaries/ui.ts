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
    "nav.about": "About",
    "nav.archives": "Archives",
    "nav.openMenu": "Open Menu",
    "nav.closeMenu": "Close Menu",
    "nav.toggleTheme": "Toggle light & dark theme",
    "nav.mainMenu": "Main Menu",
    "nav.home": "Home",
    "nav.skipToContent": "Skip to main content",

    // Footer
    "footer.copyright": "All rights reserved.",

    // Post
    "post.goBack": "Go back",
    "post.updatedOn": "Updated on",
    "post.updated": "Updated:",
    "post.readingTime": "min read",
    "post.shareOn": "Share on",
    "post.shareThisPost": "Share this post:",
    "post.featured": "Featured",
    "post.englishOnly": "English only",
    "post.series": "Article Series",
    "post.seriesPartOf": "Part {current} of {total}",
    "post.seriesNext": "Next in series",
    "post.references": "References",
    "post.viewSource": "View Source",
    "post.doi": "DOI",

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
    "a11y.breadcrumb": "Breadcrumb",
    "a11y.pagination": "Pagination",
    "a11y.seriesParts": "Series parts",
    "a11y.backToTop": "Back to top of page",
    "a11y.readPost": "Read post: {title}",
    "a11y.readFeaturedPost": "Read featured post: {title}",
    "a11y.languageNotice": "Language availability notice",
    "a11y.enlargeImage": "Enlarge image",
    "a11y.closeImage": "Close enlarged image",

    // Reading time
    "post.words": "words",

    // Table of contents
    "toc.onThisPage": "On this page",

    // Cards
    "post.readArticle": "Read article",

    // Back to top
    "nav.backToTop": "Back to top",

    // Series
    "post.seriesCurrent": "Current",

    // Language picker
    "nav.switchLanguage": "Switch to {language}",

    // Share links
    "share.via": "Share this post via {platform}",
    "share.on": "Share this post on {platform}",
    "share.viaEmail": "Share this post via email",

    // Translation fallback notice
    "post.fallbackTitle": "Article only available in English",
    "post.fallbackBody":
      "Site navigation remains in your selected language, but the body content is served in the original language.",
  },
  ka: {
    // Navigation - keeping "post" and "tag" in English
    "nav.posts": "Posts",
    "nav.tags": "Tags",
    "nav.about": "შესახებ",
    "nav.archives": "არქივი",
    "nav.openMenu": "მენიუს გახსნა",
    "nav.closeMenu": "მენიუს დახურვა",
    "nav.toggleTheme": "ღია და მუქი თემის გადართვა",
    "nav.mainMenu": "მთავარი მენიუ",
    "nav.home": "მთავარი",
    "nav.skipToContent": "ძირითად კონტენტზე გადასვლა",

    // Footer
    "footer.copyright": "ყველა უფლება დაცულია.",

    // Post
    "post.goBack": "უკან დაბრუნება",
    "post.updatedOn": "განახლებული",
    "post.updated": "განახლდა:",
    "post.readingTime": "წთ კითხვა",
    "post.shareOn": "გაზიარება",
    "post.shareThisPost": "გააზიარე ეს პოსტი:",
    "post.featured": "გამორჩეული",
    "post.englishOnly": "მხოლოდ ინგლისურად",
    "post.series": "სტატიების სერია",
    "post.seriesPartOf": "ნაწილი {current} / {total}-დან",
    "post.seriesNext": "შემდეგი სერიიდან",
    "post.references": "ლიტერატურა",
    "post.viewSource": "წყაროს ნახვა",
    "post.doi": "DOI",

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
    "a11y.breadcrumb": "ნავიგაციის ბილიკი",
    "a11y.pagination": "გვერდებად დაყოფა",
    "a11y.seriesParts": "სერიის ნაწილები",
    "a11y.backToTop": "გვერდის თავში დაბრუნება",
    "a11y.readPost": "პოსტის წაკითხვა: {title}",
    "a11y.readFeaturedPost": "გამორჩეული პოსტის წაკითხვა: {title}",
    "a11y.languageNotice": "შეტყობინება ენის ხელმისაწვდომობის შესახებ",
    "a11y.enlargeImage": "სურათის გადიდება",
    "a11y.closeImage": "გადიდებული სურათის დახურვა",

    // Reading time
    "post.words": "სიტყვა",

    // Table of contents
    "toc.onThisPage": "ამ გვერდზე",

    // Cards
    "post.readArticle": "სტატიის წაკითხვა",

    // Back to top
    "nav.backToTop": "თავში დაბრუნება",

    // Series
    "post.seriesCurrent": "მიმდინარე",

    // Language picker
    "nav.switchLanguage": "ენის შეცვლა: {language}",

    // Share links
    "share.via": "გაზიარება {platform}-ით",
    "share.on": "გაზიარება {platform}-ზე",
    "share.viaEmail": "ელფოსტით გაზიარება",

    // Translation fallback notice
    "post.fallbackTitle": "სტატია ხელმისაწვდომია მხოლოდ ინგლისურ ენაზე",
    "post.fallbackBody":
      "თქვენ იმყოფებით ქართულენოვან ინტერფეისში, თუმცა წინამდებარე პუბლიკაცია წარმოდგენილია ორიგინალ ენაზე.",
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

/**
 * Compile-time validation: This will error if `ka` is missing any keys from `en`.
 * The variable is exported to suppress "unused variable" warnings.
 */
export const _validateKa: ValidateTranslations = {} as ValidateTranslations;
