import { describe, expect, it } from "vitest";

import { nextStepOf } from "@/lib/applications";

const now = new Date("2026-11-28T12:00:00Z");
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 86_400_000).toISOString();

describe("nextStepOf", () => {
  it("asks to send a saved application, by its deadline when there is one", () => {
    expect(
      nextStepOf({ status: "saved", appliedAt: null, deadline: null }, now),
    ).toEqual({ key: "send" });
    expect(
      nextStepOf(
        { status: "saved", appliedAt: null, deadline: "2026-12-04" },
        now,
      ),
    ).toEqual({ key: "sendBy", date: "2026-12-04" });
  });

  it("waits a week after applying, then suggests a follow-up", () => {
    const applied = (days: number) =>
      nextStepOf(
        { status: "applied", appliedAt: daysAgo(days), deadline: null },
        now,
      );
    expect(applied(3)).toEqual({ key: "wait" });
    expect(applied(7)).toEqual({ key: "followUp" });
  });

  it.each([
    ["interview", "prepare"],
    ["offer", "answer"],
    ["on_hold", "reconnect"],
  ])("%s → %s", (status, key) => {
    expect(
      nextStepOf({ status, appliedAt: null, deadline: null }, now),
    ).toEqual({ key });
  });

  it("has nothing to do for a rejected application", () => {
    expect(
      nextStepOf({ status: "rejected", appliedAt: null, deadline: null }, now),
    ).toBeNull();
  });
});
