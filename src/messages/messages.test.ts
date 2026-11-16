import { describe, expect, it } from "vitest";

import { LOCALES } from "@/i18n/config";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

const catalogs: Record<(typeof LOCALES)[number], object> = { en, es };

/** Flattens nested messages into dotted keys: { a: { b: "x" } } → ["a.b"]. */
function keysOf(node: object, prefix = ""): string[] {
  return Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "object" && value !== null
      ? keysOf(value, path)
      : [path];
  });
}

function emptyValuesOf(node: object, prefix = ""): string[] {
  return Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null)
      return emptyValuesOf(value, path);
    return typeof value === "string" && value.trim() !== "" ? [] : [path];
  });
}

describe("message catalogs", () => {
  const reference = keysOf(en).sort();

  it.each(LOCALES)("%s has exactly the same keys as en", (locale) => {
    expect(keysOf(catalogs[locale]).sort()).toEqual(reference);
  });

  it.each(LOCALES)("%s has no empty or non-string values", (locale) => {
    expect(emptyValuesOf(catalogs[locale])).toEqual([]);
  });
});
