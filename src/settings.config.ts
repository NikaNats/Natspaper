// This file contains behavioral settings and feature flags.
// It can import from other config files.

export const settingsConfig = {
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true,
  lightAndDarkMode: true,
  dynamicOgImage: true,
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "https://github.com/NikaNats/portfolio/edit/main/",
  },
};
