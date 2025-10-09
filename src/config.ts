/**
 * Validate that the timezone is a valid IANA timezone identifier.
 * Prevents silent failures where typos like "Asia/Bangkk" go unnoticed.
 * @param timezone - Timezone string to validate (IANA format)
 * @throws Error if timezone is invalid
 */
function validateTimezone(timezone: string): void {
  try {
    // Try to format a date in this timezone. If it fails, timezone is invalid.
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });
    // Force evaluation by formatting a date
    formatter.format(new Date());
  } catch (error) {
    throw new Error(
      `Invalid timezone "${timezone}". Must be a valid IANA timezone identifier. ${error instanceof Error ? error.message : ""}`
    );
  }
}

export const SITE = {
  website: "https://astro-paper.pages.dev/", // replace this with your deployed domain
  author: "Sat Naing",
  profile: "https://satnaing.dev/",
  desc: "A minimal, responsive and SEO-friendly Astro blog theme.",
  title: "AstroPaper",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: true,
    text: "Edit page",
    url: "https://github.com/satnaing/astro-paper/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "Asia/Bangkok", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;

// Validate timezone at config load to prevent silent failures
validateTimezone(SITE.timezone);
