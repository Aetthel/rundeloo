import { describe, expect, it } from "vitest";

import { isAuthPreview } from "@/lib/dev-preview";

describe("isAuthPreview", () => {
  it("is on only in development with the flag set to 1", () => {
    expect(
      isAuthPreview({ NODE_ENV: "development", DEV_PREVIEW_NO_AUTH: "1" }),
    ).toBe(true);
  });

  it.each([
    [{ NODE_ENV: "production", DEV_PREVIEW_NO_AUTH: "1" }],
    [{ NODE_ENV: "test", DEV_PREVIEW_NO_AUTH: "1" }],
    [{ NODE_ENV: "development" }],
    [{ NODE_ENV: "development", DEV_PREVIEW_NO_AUTH: "true" }],
    [{}],
  ])("stays off for %o", (env) => {
    expect(isAuthPreview(env)).toBe(false);
  });
});
