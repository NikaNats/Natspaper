import { useTranslations } from "@/i18n/utils";

/**
 * Generates copyright text for the footer
 * @param locale - The current locale (en or ka)
 * @returns Formatted copyright text with current year and translated copyright notice
 */
export function getCopyrightText(locale: "en" | "ka"): string {
  const t = useTranslations(locale);
  const currentYear = new Date().getFullYear();
  return `Copyright © ${currentYear} • ${t("footer.copyright")}`;
}
