import { z } from "zod";

// bcrypt (Supabase Auth) ignores everything after 72 bytes, so longer passwords give false security.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

// Error messages are i18n keys under "auth.errors", resolved by the form.
// Normalize first, then validate: a pasted trailing space must not fail the format check.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("invalidEmail").max(254, "invalidEmail"));

const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, "passwordTooShort")
  .max(PASSWORD_MAX_LENGTH, "passwordTooLong");

export const signUpSchema = z.strictObject({
  fullName: z
    .string()
    .trim()
    .min(1, "fullNameRequired")
    .max(100, "fullNameTooLong"),
  email,
  password,
  // Optional: the trigger ignores values it doesn't recognise.
  timezone: z.string().max(64).optional(),
});

export const signInSchema = z.strictObject({
  email,
  // Only presence here: the length rules would leak the policy to someone guessing.
  password: z
    .string()
    .min(1, "passwordRequired")
    .max(PASSWORD_MAX_LENGTH, "passwordTooLong"),
});

export const forgotPasswordSchema = z.strictObject({ email });

export const resetPasswordSchema = z
  .strictObject({ password, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordsDontMatch",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
