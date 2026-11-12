import { SOCIALS } from "@/config";
import type { SvgComponent } from "astro/types";
import type { UIKey } from "@/i18n/dictionaries/ui";

// Import all icons dynamically or explicitly
import IconMail from "@/assets/icons/IconMail.svg";
import IconGitHub from "@/assets/icons/IconGitHub.svg";
import IconBrandX from "@/assets/icons/IconBrandX.svg";
import IconLinkedin from "@/assets/icons/IconLinkedin.svg";
import IconWhatsapp from "@/assets/icons/IconWhatsapp.svg";
import IconFacebook from "@/assets/icons/IconFacebook.svg";
import IconTelegram from "@/assets/icons/IconTelegram.svg";
import IconPinterest from "@/assets/icons/IconPinterest.svg";
import IconRss from "@/assets/icons/IconRss.svg";

const iconMap: Record<string, SvgComponent> = {
  IconMail,
  IconGitHub,
  IconBrandX,
  IconLinkedin,
  IconWhatsapp,
  IconFacebook,
  IconTelegram,
  IconPinterest,
  IconRss,
};

export const getSocials = () => {
  return SOCIALS.filter(s => s.active).map(s => ({
    ...s,
    linkTitle: s.linkTitle || `${s.name}`,
    icon: iconMap[s.icon] || IconMail, // Fallback icon
  }));
};

/**
 * Share targets. Labels are i18n keys (resolved with `t(titleKey, { platform:
 * name })` in ShareLinks.astro), never hardcoded English, so Georgian pages
 * get Georgian accessible names.
 */
export const SHARE_LINKS: ReadonlyArray<{
  name: string;
  href: string;
  titleKey: UIKey;
  icon: SvgComponent;
}> = [
  {
    name: "WhatsApp",
    href: "https://wa.me/?text=",
    titleKey: "share.via",
    icon: IconWhatsapp,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/sharer.php?u=",
    titleKey: "share.on",
    icon: IconFacebook,
  },
  {
    name: "X",
    href: "https://x.com/intent/post?url=",
    titleKey: "share.on",
    icon: IconBrandX,
  },
  {
    name: "Telegram",
    href: "https://t.me/share/url?url=",
    titleKey: "share.via",
    icon: IconTelegram,
  },
  {
    name: "Pinterest",
    href: "https://pinterest.com/pin/create/button/?url=",
    titleKey: "share.on",
    icon: IconPinterest,
  },
  {
    name: "Mail",
    href: "mailto:?subject=See%20this%20post&body=",
    titleKey: "share.viaEmail",
    icon: IconMail,
  },
];
