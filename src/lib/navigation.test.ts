import { describe, expect, it } from "vitest";

import { breadcrumbFor, isActive } from "@/lib/navigation";

describe("isActive", () => {
  it.each([
    ["/applications", "/applications", true],
    ["/applications/123/notes", "/applications", true],
    ["/applicationsx", "/applications", false],
    ["/settings", "/settings", true],
    ["/settings/billing", "/settings", false],
    ["/settings/billing", "/settings/billing", true],
  ])("%s on %s → %s", (pathname, href, expected) => {
    expect(isActive(pathname, href)).toBe(expected);
  });
});

describe("breadcrumbFor", () => {
  it.each([
    ["/dashboard", { key: "dashboard", href: "/dashboard", detail: false }],
    [
      "/applications/abc/interviews",
      { key: "applications", href: "/applications", detail: true },
    ],
    [
      "/settings/billing",
      { key: "billing", href: "/settings/billing", detail: false },
    ],
    ["/interviews/abc/prep", null],
  ])("%s", (pathname, expected) => {
    expect(breadcrumbFor(pathname)).toEqual(expected);
  });
});
