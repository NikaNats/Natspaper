export const defaultLang = "en";

export const languages = {
  en: "English",
  ka: "ქართული",
} as const;

export const supportedLangs = Object.keys(languages) as Lang[];

export type Lang = keyof typeof languages;
