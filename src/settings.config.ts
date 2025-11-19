// This file contains behavioral settings and feature flags.
// It can import from other config files.

export const settingsConfig = {
  postPerIndex: 4,
  postPerPage: 4,
  rssLimit: 50, // Number of items to include in RSS feeds
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true,
  lightAndDarkMode: true,
  dynamicOgImage: true,

  // Reading & UX
  readingTimeWPM: 200, // Words per minute used by reading time utility
  backToTopThreshold: 0.3, // Scroll percentage to reveal BackToTop
  scrollSmooth: true,
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "https://github.com/NikaNats/portfolio/edit/main/",
  },
};
