import { describe, expect, it } from "vitest";

import { briefRoleTitle } from "@/lib/applications";
import { roleTitleSchema } from "@/lib/validations/application";

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
