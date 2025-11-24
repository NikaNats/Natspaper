export type Site = {
  website: string;
  author: string;
  desc: string;
  title: string;
  ogImage: string;
  lightAndDarkMode: boolean;
  postPerPage: number;
  scheduledPostMargin: number;
  showArchives?: boolean;
  editPost: {
    enabled: boolean;
    text: string;
    url: string;
  };
  profile?: string;
  scrollSmooth: boolean;
  dir: "ltr" | "rtl";
  lang: string;
  readingTimeWPM: number;
  rssLimit: number;
  dynamicOgImage: boolean;
  timezone: string;
  showBackButton?: boolean;
  backToTopThreshold?: number;
};

export type SocialObjects = {
  name: string;
  href: string;
  active: boolean;
  linkTitle: string;
};
