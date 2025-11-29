/**
 * Global Type Definitions
 * =======================
 * Centralized TypeScript interfaces for configuration objects.
 * These types are the single source of truth for the shape of config data.
 *
 * Design Principles:
 * - All optional fields are explicitly marked with `?`
 * - Union types are used for constrained string values
 * - JSDoc comments explain the purpose of each field
 *
 * @example
 * import type { SiteConfig, FeaturesConfig } from '@/types';
 */

/**
 * Site Identity & Metadata Configuration
 * Used for SEO, OpenGraph, and site-wide branding
 */
export interface SiteConfig {
  /** Production URL (with trailing slash) - used for canonical URLs and sitemaps */
  website: string;
  /** Site title - appears in browser tabs and social cards */
  title: string;
  /** Site description for meta tags */
  desc: string;
  /** Author name for attribution */
  author: string;
  /** Author profile URL (LinkedIn, Twitter, etc.) */
  profile: string;
  /** Default OpenGraph image filename (relative to /public) */
  ogImage: string;
  /** Default language code (ISO 639-1) */
  lang: string;
  /** Text direction for the default language */
  dir: "ltr" | "rtl";
  /** IANA timezone for date formatting */
  timezone: string;
}

/**
 * Feature Flags & Behavioral Settings
 * Controls UI features, pagination, and advanced behaviors
 */
export interface FeaturesConfig {
  /** Enable dark/light mode toggle */
  lightAndDarkMode: boolean;
  /** Number of posts per page on listing pages */
  postPerPage: number;
  /** Number of posts shown on homepage */
  postPerIndex: number;
  /** Maximum items in RSS feed */
  rssLimit: number;
  /** Margin (ms) for scheduled post visibility (prevents cache issues) */
  scheduledPostMargin: number;
  /** Show archives navigation link */
  showArchives: boolean;
  /** Show back navigation button */
  showBackButton: boolean;
  /** Enable smooth scrolling for anchor links */
  scrollSmooth: boolean;
  /** Words per minute for reading time calculation */
  readingTimeWPM: number;
  /** Scroll percentage (0-1) to trigger back-to-top button */
  backToTopThreshold: number;
  /** Generate dynamic OG images for posts */
  dynamicOgImage: boolean;
  /** Edit post link configuration */
  editPost: EditPostConfig;
}

/**
 * Edit Post Link Configuration
 * Enables "Edit this page" links on blog posts
 */
export interface EditPostConfig {
  /** Enable/disable edit links globally */
  enabled: boolean;
  /** Link text displayed to users */
  text: string;
  /** Base URL for edit links (post path appended) */
  url: string;
}

/**
 * Social Media Link Definition
 * Used in footer, bio sections, and share dialogs
 */
export interface SocialLink {
  /** Display name for the social platform */
  name: string;
  /** Full URL to the social profile */
  href: string;
  /** Icon component name (matches filename in src/assets/icons/) */
  icon: string;
  /** Whether to display this link */
  active: boolean;
  /** Optional override for link title/tooltip */
  linkTitle?: string;
}

/**
 * Giscus Comments Configuration
 * @see https://giscus.app/ for configuration
 */
export interface GiscusConfig {
  /** Enable/disable comments globally */
  enabled: boolean;
  /** GitHub repository in "owner/repo" format */
  repo: string;
  /** GitHub repository ID (from giscus.app) */
  repoId: string;
  /** Discussion category name */
  category: string;
  /** Discussion category ID (from giscus.app) */
  categoryId: string;
  /** How to map posts to discussions */
  mapping: "pathname" | "url" | "title" | "og:title";
  /** Show reaction buttons */
  reactionsEnabled: boolean;
  /** Emit discussion metadata */
  emitMetadata: boolean;
  /** Input box position */
  inputPosition: "top" | "bottom";
  /** Interface language */
  lang: string;
  /** Loading strategy */
  loading: "lazy" | "eager";
}

/**
 * Navigation Menu Item
 * Defines entries in the main navigation menu
 */
export interface NavigationItem {
  /** URL path (can be relative) */
  href: string;
  /** i18n key for the link text (e.g., "nav.posts") */
  text: string;
}

/**
 * Breadcrumb Navigation Item
 * Used for visual breadcrumb navigation and structured data
 */
export interface BreadcrumbItem {
  /** Display text for the breadcrumb link */
  label: string;
  /** URL for the breadcrumb (undefined for current page) */
  href?: string;
}

/**
 * Post Adjacent Navigation
 * Links to previous/next posts for navigation
 */
export interface AdjacentPost {
  /** Post URL slug */
  slug: string;
  /** Post title for display */
  title: string;
}

/**
 * Reading Time Result
 * Output from reading time calculation utilities
 */
export interface ReadingTimeResult {
  /** Estimated minutes to read */
  minutes: number;
  /** Word count */
  words: number;
  /** Formatted display string (e.g., "5 min read") */
  text: string;
}
