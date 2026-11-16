// Locale resolution rules (option B, no locale in the URL). Kept free of I/O so they can be unit tested.

import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";

/**
 * Picks the best supported locale from an Accept-Language header, honouring q-values.
 * Region subtags are ignored: "es-MX" matches "es".
 */
export function localeFromAcceptLanguage(
  header: string | null | undefined,
): Locale | null {
  if (!header) return null;

  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const quality = qParam ? Number(qParam.trim().slice(2)) : 1;
      return {
        language: tag.trim().toLowerCase().split("-")[0],
        quality: Number.isFinite(quality) ? quality : 0,
        index,
      };
    })
    .filter(({ quality }) => quality > 0)
    // Stable on ties: earlier entries win, as the header order intends.
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const { language } of ranked) {
    if (isLocale(language)) return language;
  }
  return null;
}

/**
 * Priority, highest first: profiles.language → cookie → Accept-Language → "en".
 * The profile value reaches the request as the cookie: src/proxy.ts keeps them in sync.
 */
export function resolveLocale({
  profileLanguage,
  cookie,
  acceptLanguage,
}: {
  profileLanguage?: string | null;
  cookie?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(profileLanguage)) return profileLanguage;
  if (isLocale(cookie)) return cookie;
  return localeFromAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
}
