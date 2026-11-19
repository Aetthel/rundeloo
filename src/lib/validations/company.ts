import { z } from "zod";

import { normalizeWebsite } from "@/lib/companies";
import { CONTACT_ROLES } from "@/lib/constants";

// Error messages are i18n keys under "companies.errors".

/** Empty strings from the form become null, so optional columns stay NULL. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "tooLong")
    .transform((value) => value || null);

export const companySchema = z.strictObject({
  name: z.string().trim().min(1, "nameRequired").max(120, "tooLong"),
  website: z
    .string()
    .trim()
    .max(300, "tooLong")
    .transform((value, ctx) => {
      if (!value) return null;
      const url = normalizeWebsite(value);
      if (!url) ctx.addIssue({ code: "custom", message: "invalidWebsite" });
      return url;
    }),
  industry: optionalText(80),
  location: optionalText(120),
  notes: optionalText(5000),
});

export const contactSchema = z.strictObject({
  fullName: z.string().trim().min(1, "nameRequired").max(120, "tooLong"),
  contactRole: z
    .enum(CONTACT_ROLES)
    .nullable()
    .or(z.literal("").transform(() => null)),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "tooLong")
    .transform((value, ctx) => {
      if (!value) return null;
      if (!z.email().safeParse(value).success) {
        ctx.addIssue({ code: "custom", message: "invalidEmail" });
      }
      return value;
    }),
  phone: optionalText(40),
  linkedinUrl: z
    .string()
    .trim()
    .max(300, "tooLong")
    .transform((value, ctx) => {
      if (!value) return null;
      const url = normalizeWebsite(value);
      if (!url || !/(^|\.)linkedin\.com$/i.test(new URL(url).hostname)) {
        ctx.addIssue({ code: "custom", message: "invalidLinkedin" });
        return null;
      }
      return url;
    }),
  notes: optionalText(5000),
});

export const idSchema = z.uuid();

export type CompanyInput = z.infer<typeof companySchema>;
export type ContactInput = z.infer<typeof contactSchema>;
