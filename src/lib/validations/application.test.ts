import { describe, expect, it } from "vitest";

import { briefRoleTitle } from "@/lib/applications";
import {
  applicationSchema,
  roleTitleSchema,
} from "@/lib/validations/application";

describe("briefRoleTitle", () => {
  it.each([
    ["Frontend Developer", "Frontend Developer"],
    ["  Frontend   Engineer  ", "Frontend Engineer"],
    ["Frontend Engineer, Growth", "Frontend Engineer"],
    ["Frontend Engineer (Remote)", "Frontend Engineer"],
    ["Backend Engineer - Billing", "Backend Engineer"],
    ["Backend Engineer – Payments team", "Backend Engineer"],
    ["Software Engineer | Madrid", "Software Engineer"],
    ["Product Engineer @ Linear", "Product Engineer"],
    ["Ingeniero frontend, app de repartidores", "Ingeniero frontend"],
    ["Full-stack Engineer", "Full-stack Engineer"],
    ["UX/UI Designer", "UX/UI Designer"],
  ])("%s → %s", (raw, brief) => {
    expect(briefRoleTitle(raw)).toBe(brief);
  });

  it("keeps the text when there is nothing before the separator", () => {
    expect(briefRoleTitle("(Senior) Engineer")).toBe("(Senior) Engineer");
  });
});

describe("roleTitleSchema", () => {
  it("saves the brief title", () => {
    expect(roleTitleSchema.parse("Frontend Engineer, Canvas")).toBe(
      "Frontend Engineer",
    );
  });

  it("requires a title", () => {
    const result = roleTitleSchema.safeParse("   ");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("roleTitleRequired");
  });

  it("rejects titles that do not fit on a card", () => {
    const result = roleTitleSchema.safeParse(
      "Senior Staff Principal Software Engineer",
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("roleTitleTooLong");
  });
});

describe("applicationSchema", () => {
  const valid = {
    companyId: "00000000-0000-4000-8000-000000000001",
    roleTitle: "Frontend Engineer, Growth",
    status: "applied",
    workMode: "remote",
    appliedAt: "2026-11-20",
    deadline: "",
    jobUrl: "linkedin.com/jobs/view/123",
  };

  it("normalizes what the edit form sends", () => {
    expect(applicationSchema.parse(valid)).toEqual({
      companyId: valid.companyId,
      roleTitle: "Frontend Engineer",
      status: "applied",
      workMode: "remote",
      appliedAt: "2026-11-20",
      deadline: null,
      jobUrl: "https://linkedin.com/jobs/view/123",
    });
  });

  it("turns the empty work mode and link into null", () => {
    const result = applicationSchema.parse({
      ...valid,
      workMode: "none",
      jobUrl: "",
    });
    expect(result.workMode).toBeNull();
    expect(result.jobUrl).toBeNull();
  });

  it.each([
    ["appliedAt", "2026-02-30", "invalidDate"],
    ["deadline", "tomorrow", "invalidDate"],
    ["jobUrl", "not a link", "invalidUrl"],
    ["status", "hired", undefined],
  ])("rejects %s = %s", (field, value, message) => {
    const result = applicationSchema.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    if (message) expect(result.error?.issues[0]?.message).toBe(message);
  });
});
