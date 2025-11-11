import { siteConfig } from './site.config';
import { settingsConfig } from './settings.config';

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

// This is the runtime configuration that requires validation.
const runtimeConfig = {
  timezone: "Asia/Tbilisi",
};

// Validate the runtime config immediately.
validateTimezone(runtimeConfig.timezone);

// Export a single, unified SITE object for easy access in your app.
// This is a composition of all the other config files.
export const SITE = {
  ...siteConfig,
  ...settingsConfig,
  ...runtimeConfig,
} as const;
