import { describe, expect, it } from "vitest";

import {
  bestStage,
  displayHost,
  initialsOf,
  latestDate,
  normalizeWebsite,
  stageRank,
} from "@/lib/companies";

describe("bestStage", () => {
  it.each([
    [[], null],
    [["rejected", "saved"], "saved"],
    [["applied", "offer", "interview"], "offer"],
    [["on_hold", "rejected"], "on_hold"],
  ] as const)("%j → %s", (statuses, expected) => {
    expect(bestStage(statuses)).toBe(expected);
  });
});

describe("stageRank", () => {
  it("orders offer first and companies without applications last", () => {
    expect(stageRank("offer")).toBeLessThan(stageRank("interview"));
    expect(stageRank("rejected")).toBeLessThan(stageRank(null));
  });
});

describe("latestDate", () => {
  it("returns the latest date and ignores nulls", () => {
    expect(
      latestDate([
        null,
        "2026-11-01T10:00:00Z",
        undefined,
        "2026-11-03T09:00:00Z",
      ]),
    ).toBe("2026-11-03T09:00:00Z");
    expect(latestDate([null])).toBeNull();
  });
});

describe("normalizeWebsite", () => {
  it.each([
    ["acme.com", "https://acme.com"],
    [" https://www.acme.com/ ", "https://www.acme.com"],
    ["http://acme.io/jobs", "http://acme.io/jobs"],
    ["", null],
    ["acme", null],
    ["javascript:alert(1)", null],
    ["mailto:hr@acme.com", null],
    ["ftp://acme.com", null],
  ])("%s → %s", (input, expected) => {
    expect(normalizeWebsite(input)).toBe(expected);
  });
});

describe("displayHost", () => {
  it("drops the scheme, www and path", () => {
    expect(displayHost("https://www.acme.com/jobs")).toBe("acme.com");
  });
});

describe("initialsOf", () => {
  it.each([
    ["Acme Labs", "AL"],
    ["stripe", "S"],
    ["  ", "?"],
  ])("%s → %s", (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });
});
