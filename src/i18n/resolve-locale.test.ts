import { describe, expect, it } from "vitest";

import { localeFromAcceptLanguage, resolveLocale } from "@/i18n/resolve-locale";

describe("localeFromAcceptLanguage", () => {
  it.each([
    ["es-ES,es;q=0.9,en;q=0.8", "es"],
    ["en-US,en;q=0.9", "en"],
    ["es-MX", "es"],
    ["fr-FR,fr;q=0.9,es;q=0.8,en;q=0.7", "es"],
    ["en;q=0.5,es;q=0.8", "es"],
    ["es;q=0.8,en;q=0.8", "es"],
    ["ES", "es"],
    ["es;q=0,en;q=0.1", "en"],
  ])("picks the best supported locale from %s", (header, expected) => {
    expect(localeFromAcceptLanguage(header)).toBe(expected);
  });

  it.each([null, undefined, "", "fr-FR,de;q=0.9", "*", "es;q=0"])(
    "returns null when nothing supported is accepted (%s)",
    (header) => {
      expect(localeFromAcceptLanguage(header)).toBeNull();
    },
  );
});

describe("resolveLocale", () => {
  it.each([
    [{ profileLanguage: "es", cookie: "en", acceptLanguage: "en" }, "es"],
    [{ profileLanguage: null, cookie: "es", acceptLanguage: "en" }, "es"],
    [{ profileLanguage: "fr", cookie: "es", acceptLanguage: "en" }, "es"],
    [{ cookie: "de", acceptLanguage: "es-ES" }, "es"],
    [{ acceptLanguage: "fr-FR" }, "en"],
    [{}, "en"],
  ])("applies profile → cookie → header → en for %o", (input, expected) => {
    expect(resolveLocale(input)).toBe(expected);
  });
});
