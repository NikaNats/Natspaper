import type { SvgComponent } from "astro/types";
import IconMail from "@/assets/icons/IconMail.svg";
import IconGitHub from "@/assets/icons/IconGitHub.svg";
import IconBrandX from "@/assets/icons/IconBrandX.svg";
import IconLinkedin from "@/assets/icons/IconLinkedin.svg";
import IconWhatsapp from "@/assets/icons/IconWhatsapp.svg";
import IconFacebook from "@/assets/icons/IconFacebook.svg";
import IconTelegram from "@/assets/icons/IconTelegram.svg";
import IconPinterest from "@/assets/icons/IconPinterest.svg";
import IconRss from "@/assets/icons/IconRss.svg";

// REFACTORED: This module no longer depends on the global SITE config.
// It is now a pure, self-contained data module.

interface Social {
  name: string;
  href: string;
  linkTitle: (siteTitle: string) => string; // The title is now a function.
  icon: SvgComponent;
}

export const SOCIALS: Social[] = [
  {
    name: "GitHub",
    href: "https://github.com/NikaNats",
    linkTitle: siteTitle => `${siteTitle} on GitHub`,
    icon: IconGitHub,
  },
  {
    name: "X",
    href: "https://x.com/NNats8",
    linkTitle: siteTitle => `${siteTitle} on X`,
    icon: IconBrandX,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/nika-natsvlishvili/",
    linkTitle: siteTitle => `${siteTitle} on LinkedIn`,
    icon: IconLinkedin,
  },
  {
    name: "Mail",
    href: "mailto:nika.nacvlishvili1@gmail.com",
    linkTitle: siteTitle => `Send an email to ${siteTitle}`,
    icon: IconMail,
  },
  {
    name: "RSS",
    href: "/rss.xml",
    linkTitle: () => "RSS Feed",
    icon: IconRss,
  },
] as const;

export const SHARE_LINKS: Social[] = [
  {
    name: "WhatsApp",
    href: "https://wa.me/?text=",
    linkTitle: () => `Share this post via WhatsApp`,
    icon: IconWhatsapp,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/sharer.php?u=",
    linkTitle: () => `Share this post on Facebook`,
    icon: IconFacebook,
  },
  {
    name: "X",
    href: "https://x.com/intent/post?url=",
    linkTitle: () => `Share this post on X`,
    icon: IconBrandX,
  },
  {
    name: "Telegram",
    href: "https://t.me/share/url?url=",
    linkTitle: () => `Share this post via Telegram`,
    icon: IconTelegram,
  },
  {
    name: "Pinterest",
    href: "https://pinterest.com/pin/create/button/?url=",
    linkTitle: () => `Share this post on Pinterest`,
    icon: IconPinterest,
  },
  {
    name: "Mail",
    href: "mailto:?subject=See%20this%20post&body=",
    linkTitle: () => `Share this post via email`,
    icon: IconMail,
  },
] as const;
