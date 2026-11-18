import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "@/lib/safe-redirect";

describe("safeRedirectPath", () => {
  it.each([
    "/applications?view=board",
    "/companies/123/contacts",
    "/reset-password",
  ])("keeps the internal path %s", (path) => {
    expect(safeRedirectPath(path)).toBe(path);
  });

  it.each([
    ["missing", null],
    ["empty", ""],
    ["absolute URL", "https://evil.com"],
    ["protocol-relative", "//evil.com"],
    ["backslash", "/\\evil.com"],
    ["relative", "dashboard"],
    // Browsers strip tab, CR and LF from URLs, turning these into //evil.com.
    ["tab-split", "/\t/evil.com"],
    ["newline-split", "/\n/evil.com"],
    ["carriage-return-split", "/\r//evil.com"],
    ["null byte", "/dash\u0000board"],
  ])("falls back to /dashboard for a %s value", (_, value) => {
    expect(safeRedirectPath(value)).toBe("/dashboard");
  });

  it("uses the given fallback", () => {
    expect(safeRedirectPath("//evil.com", "/login")).toBe("/login");
  });
});
