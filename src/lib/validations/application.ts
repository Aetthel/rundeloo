import { z } from "zod";

import { briefRoleTitle, ROLE_TITLE_MAX } from "@/lib/applications";
import { normalizeWebsite } from "@/lib/companies";
import { type ApplicationStatus, PIPELINE_FUNNEL } from "@/lib/constants";

// Error messages are i18n keys under "applications.errors".

/**
 * Role title as the application forms save it: cut down to the role itself
 * (see briefRoleTitle), then capped so it fits on one line of a board card.
 */
export const roleTitleSchema = z
  .string()
  .transform(briefRoleTitle)
  .pipe(
    z
      .string()
      .min(1, "roleTitleRequired")
      .max(ROLE_TITLE_MAX, "roleTitleTooLong"),
  );

/** "" from an empty date input becomes null; otherwise a real YYYY-MM-DD day. */
const optionalDate = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) return null;
    const day = new Date(`${value}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(day.getTime()) ||
      day.toISOString().slice(0, 10) !== value
    ) {
      ctx.addIssue({ code: "custom", message: "invalidDate" });
      return z.NEVER;
    }
    return value;
  });

/** Every field the table shows, as the edit form sends them. */
export const applicationSchema = z.strictObject({
  companyId: z.uuid("notFound"),
  roleTitle: roleTitleSchema,
  status: z.enum(
    PIPELINE_FUNNEL as [ApplicationStatus, ...ApplicationStatus[]],
  ),
  // "none" is the select's empty option.
  workMode: z
    .enum(["remote", "hybrid", "onsite", "none"])
    .transform((value) => (value === "none" ? null : value)),
  appliedAt: optionalDate,
  deadline: optionalDate,
  jobUrl: z
    .string()
    .trim()
    .max(500, "tooLong")
    .transform((value, ctx) => {
      if (!value) return null;
      const url = normalizeWebsite(value);
      if (!url) {
        ctx.addIssue({ code: "custom", message: "invalidUrl" });
        return z.NEVER;
      }
      return url;
    }),
});

export type ApplicationInput = z.output<typeof applicationSchema>;
