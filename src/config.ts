import type { SiteConfig, FeaturesConfig, SocialLink } from "./types";

/**
 * MASTER CONFIGURATION
 * --------------------------------------------------------
 * This is the single source of truth for your website.
 * Edit this file to customize your blog's identity, features, and behavior.
 */

// 1. Site Identity & Metadata
export const SITE: SiteConfig = {
  website: "https://natspaper.vercel.app/", // Your production URL
  title: "NatsPaper",
  desc: ".NET Developer | Software Engineer specializing in microservices architecture.",
  author: "Nika Natsvlishvili",
  profile: "https://www.linkedin.com/in/nika-natsvlishvili/",

  // Localization Settings
  lang: "en", // Default language for HTML tag
  dir: "ltr", // Text direction: 'ltr' | 'rtl'
  timezone: "Asia/Tbilisi", // For scheduling and date formatting

  // Assets
  ogImage: "astropaper-og.jpg", // Default OpenGraph image in /public
};

// CONFIG VALIDATION: Ensure timezone is valid to prevent build crashes in dayjs
try {
  Intl.DateTimeFormat(undefined, { timeZone: SITE.timezone });
} catch {
  throw new Error(
    `❌ Invalid timezone configuration: "${SITE.timezone}".\n` +
      `Please check 'timezone' in src/config.ts. It must be a valid IANA timezone string (e.g., "America/New_York", "Asia/Tbilisi").`
  );
}

// 2. Feature Flags & Behavior
export const FEATURES: FeaturesConfig = {
  // UI/UX Toggles
  lightAndDarkMode: true,
  showBackButton: true,
  showArchives: true,
  scrollSmooth: true,

  // Content & Navigation
  postPerPage: 4,
  postPerIndex: 4,
  rssLimit: 50,

  // Advanced Logic
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes (allows caching pre-publish)
  readingTimeWPM: 200, // Words Per Minute calculation
  backToTopThreshold: 0.3, // Scroll % to show button
  dynamicOgImage: true, // Generate social cards automatically

  // Edit Link (bottom of posts)
  editPost: {
    enabled: false,
    url: "https://github.com/NikaNats/Natspaper/edit/main/",
    text: "Edit this page",
  },
};

// 3. Social Media Links
// These will appear in the footer and bio sections
export const SOCIALS: SocialLink[] = [
  {
    name: "GitHub",
    href: "https://github.com/NikaNats",
    icon: "IconGitHub", // ID matches filename in src/assets/icons/
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/nika-natsvlishvili/",
    icon: "IconLinkedin",
    active: true,
  },
  {
    name: "Twitter",
    href: "https://x.com/NNats8",
    icon: "IconBrandX",
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:nika.nacvlishvili1@gmail.com",
    icon: "IconMail",
    active: true,
  },
  {
    name: "RSS",
    href: "/rss.xml",
    icon: "IconRss",
    active: true,
  },
];

// 4. Navigation Menu
// Configures the main header menu
export const NAVIGATION = [
  { href: "/posts", text: "nav.posts" },
  { href: "/tags", text: "nav.tags" },
  { href: "/archives", text: "nav.archives" },
];
