/**
 * Validate that the timezone is a valid IANA timezone identifier.
 * Prevents silent failures where typos like "Asia/Bangkk" go unnoticed.
 * This validation runs at config load time (build-time) so errors are caught immediately.
 *
 * @param timezone - Timezone string to validate (IANA format)
 * @throws Error if timezone is invalid
 * @example
 *   validateTimezone("America/New_York"); // OK
 *   validateTimezone("Invalid/Zone"); // Throws
 */
function validateTimezone(timezone: string): void {
  if (!timezone || typeof timezone !== "string") {
    throw new Error(
      "SITE.timezone must be a non-empty string (valid IANA timezone identifier)"
    );
  }

  try {
    // Try to format a date in this timezone. If it fails, timezone is invalid.
    // This is the most reliable way to validate IANA timezones.
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });
    // Force evaluation by formatting a date to catch any errors
    formatter.format(new Date());
  } catch (error) {
    throw new Error(
      `Invalid SITE.timezone: "${timezone}". Must be a valid IANA timezone identifier. ` +
        `See: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones. ` +
        `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const SITE = {
  website: "https://natspaper.vercel.app/", // replace this with your deployed domain
  author: "Nika Natsvlishvili",
  profile: "https://www.linkedin.com/in/nika-natsvlishvili/",
  desc: ".NET Developer | Software Engineer specializing in microservices architecture and enterprise solutions",
  title: "NatsPaper",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "https://github.com/NikaNats/portfolio/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "Asia/Tbilisi", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;

// Validate timezone at config load to prevent silent failures
validateTimezone(SITE.timezone);
