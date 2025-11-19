// Single source of truth for navigation structure
// This allows the menu to be easily updated or used in multiple places (Header, Footer, Mobile)
export interface NavLink {
  href: string;
  text: string; // i18n key
  icon?: string; // Optional icon name
  exact?: boolean; // For active state matching
}

export const NAV_LINKS: NavLink[] = [
  { href: "/posts", text: "nav.posts" },
  { href: "/tags", text: "nav.tags" },
  { href: "/archives", text: "nav.archives", icon: "IconArchive" },
];
