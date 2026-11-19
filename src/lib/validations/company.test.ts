import { describe, expect, it } from "vitest";

import { companySchema, contactSchema } from "@/lib/validations/company";

const company = {
  name: "Acme",
  website: "",
  industry: "",
  location: "",
  notes: "",
};

const contact = {
  fullName: "Ana García",
  contactRole: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  notes: "",
};

const firstError = (result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) => (result.success ? null : result.error?.issues[0]?.message);

describe("companySchema", () => {
  it("turns empty optional fields into null", () => {
    const result = companySchema.parse(company);
    expect(result).toEqual({
      name: "Acme",
      website: null,
      industry: null,
      location: null,
      notes: null,
    });
  });

  it("normalizes the website", () => {
    expect(
      companySchema.parse({ ...company, website: "acme.com" }).website,
    ).toBe("https://acme.com");
  });

  it.each([
    [{ ...company, name: " " }, "nameRequired"],
    [{ ...company, website: "javascript:alert(1)" }, "invalidWebsite"],
    [{ ...company, name: "x".repeat(121) }, "tooLong"],
  ])("rejects %o with %s", (input, message) => {
    expect(firstError(companySchema.safeParse(input))).toBe(message);
  });
});

describe("contactSchema", () => {
  it("accepts a contact with only a name", () => {
    expect(contactSchema.parse(contact)).toMatchObject({
      fullName: "Ana García",
      contactRole: null,
      email: null,
      linkedinUrl: null,
    });
  });

  it("keeps a valid role and normalizes LinkedIn", () => {
    const result = contactSchema.parse({
      ...contact,
      contactRole: "recruiter",
      linkedinUrl: "linkedin.com/in/ana",
      email: "Ana@Acme.com",
    });
    expect(result).toMatchObject({
      contactRole: "recruiter",
      linkedinUrl: "https://linkedin.com/in/ana",
      email: "ana@acme.com",
    });
  });

  it.each([
    [{ ...contact, email: "nope" }, "invalidEmail"],
    [{ ...contact, linkedinUrl: "https://evil.com/in/ana" }, "invalidLinkedin"],
    [{ ...contact, fullName: "" }, "nameRequired"],
  ])("rejects %o with %s", (input, message) => {
    expect(firstError(contactSchema.safeParse(input))).toBe(message);
  });

  it("rejects an unknown role", () => {
    expect(
      contactSchema.safeParse({ ...contact, contactRole: "ceo" }).success,
    ).toBe(false);
  });
});
