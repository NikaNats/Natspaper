import type { Site } from "./types";

export const SITE: Site = {
  website: "https://natspaper.vercel.app/",
  author: "Nika Natsvlishvili",
  desc: ".NET Developer | Software Engineer specializing in microservices architecture and enterprise solutions",
  title: "NatsPaper",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "https://github.com/NikaNats/portfolio/edit/main/",
  },
  profile: "https://www.linkedin.com/in/nika-natsvlishvili/",
  scrollSmooth: true,
  dir: "ltr",
  lang: "en",
  readingTimeWPM: 200,
  rssLimit: 50,
  dynamicOgImage: true,
  timezone: "Asia/Tbilisi",
  showBackButton: true,
  backToTopThreshold: 0.3,
};

export const LOCALE = {
  lang: "en", // html lang code. Set this once.
  langTag: ["en-EN"], // BCP 47 Language Tags.
} as const;

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};
