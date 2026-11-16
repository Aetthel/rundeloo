export const LOCALES = ["en", "es"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Written by the language switcher and kept in sync with profiles.language by src/proxy.ts. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** One year: the choice should outlive the session. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}
