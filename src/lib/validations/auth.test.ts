import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validations/auth";

const firstError = (result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) => (result.success ? null : result.error?.issues[0]?.message);

describe("signUpSchema", () => {
  const valid = {
    fullName: "Jane Doe",
    email: "Jane@Example.com ",
    password: "12345678",
    confirmPassword: "12345678",
  };

  it("accepts a valid sign-up and normalizes the email", () => {
    const result = signUpSchema.safeParse(valid);
    expect(result.success && result.data.email).toBe("jane@example.com");
  });

  it.each([
    [{ ...valid, fullName: "  " }, "fullNameRequired"],
    [{ ...valid, email: "not-an-email" }, "invalidEmail"],
    [
      { ...valid, password: "1234567", confirmPassword: "1234567" },
      "passwordTooShort",
    ],
    [
      { ...valid, password: "x".repeat(73), confirmPassword: "x".repeat(73) },
      "passwordTooLong",
    ],
    [{ ...valid, confirmPassword: "12345679" }, "passwordsDontMatch"],
  ])("rejects %o with %s", (input, message) => {
    expect(firstError(signUpSchema.safeParse(input))).toBe(message);
  });

  it("rejects unknown fields", () => {
    expect(signUpSchema.safeParse({ ...valid, role: "admin" }).success).toBe(
      false,
    );
  });
});

describe("signInSchema", () => {
  it("doesn't apply the length policy to sign-in", () => {
    expect(
      signInSchema.safeParse({ email: "a@b.co", password: "short" }).success,
    ).toBe(true);
  });

  it("requires a password", () => {
    expect(
      firstError(signInSchema.safeParse({ email: "a@b.co", password: "" })),
    ).toBe("passwordRequired");
  });
});

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(firstError(forgotPasswordSchema.safeParse({ email: "nope" }))).toBe(
      "invalidEmail",
    );
  });
});

describe("resetPasswordSchema", () => {
  it("accepts matching passwords", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "12345678",
        confirmPassword: "12345678",
      }).success,
    ).toBe(true);
  });

  it("rejects passwords that don't match, on the confirmation field", () => {
    const result = resetPasswordSchema.safeParse({
      password: "12345678",
      confirmPassword: "12345679",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      message: "passwordsDontMatch",
      path: ["confirmPassword"],
    });
  });
});
