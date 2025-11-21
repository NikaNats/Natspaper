/**
 * Site Metadata Configuration
 *
 * This file contains pure data about the website.
 * Used for SEO, Metadata, and Open Graph generation.
 */

export const siteConfig = {
  // Identity
  title: "NatsPaper",
  author: "Nika Natsvlishvili",
  desc: ".NET Developer | Software Engineer specializing in microservices architecture and enterprise solutions",

  // URLs
  profile: "https://www.linkedin.com/in/nika-natsvlishvili/",
  website: "https://natspaper.vercel.app/",

  // Assets (Centralized paths)
  assets: {
    favicon: "/favicon.svg",
    defaultOgImage: "astropaper-og.jpg",
    fallbackOgImage: "/og.png", // 1x1 pixel fallback or generic image
  },

  // Legacy support for components that still reference these
  ogImage: "astropaper-og.jpg",

  // Localization
  defaultLang: "en", // Fallback if i18n config fails
  lang: "en", // Legacy support
  dir: "ltr",
} as const;
