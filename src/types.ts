export type SiteConfig = {
  website: string;
  author: string;
  profile: string;
  desc: string;
  title: string;
  ogImage: string;
  lang: string;
  dir: "ltr" | "rtl";
  timezone: string;
};

export type FeaturesConfig = {
  lightAndDarkMode: boolean;
  postPerPage: number;
  postPerIndex: number;
  rssLimit: number;
  scheduledPostMargin: number;
  showArchives: boolean;
  showBackButton: boolean;
  scrollSmooth: boolean;
  readingTimeWPM: number;
  backToTopThreshold: number;
  dynamicOgImage: boolean;
  editPost: {
    enabled: boolean;
    text: string;
    url: string;
  };
};

export type SocialLink = {
  name: string;
  href: string;
  icon: string;
  active: boolean;
  linkTitle?: string; // Optional override
};

export type GiscusConfig = {
  enabled: boolean;
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping: "pathname" | "url" | "title" | "og:title";
  reactionsEnabled: boolean;
  emitMetadata: boolean;
  inputPosition: "top" | "bottom";
  lang: string;
  loading: "lazy" | "eager";
};
