"use server";

import "server-only";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { fieldErrorsOf, type FormState } from "@/lib/form-state";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { authCallbackUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validations/auth";
import { authErrorKey } from "@/server/auth/errors";
import { requireUser } from "@/server/auth/session";

const field = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
};

export async function signUp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    fullName: field(formData, "fullName"),
    email: field(formData, "email"),
    password: field(formData, "password"),
    confirmPassword: field(formData, "confirmPassword"),
    timezone: field(formData, "timezone") || undefined,
  });
  const values = {
    fullName: field(formData, "fullName"),
    email: field(formData, "email"),
  };
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: fieldErrorsOf(parsed.error),
      values,
    };
  }

  const { fullName, email, password, timezone } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: authCallbackUrl("/onboarding"),
      // Read by public.handle_new_user(), which validates each value before saving it.
      data: { full_name: fullName, language: await getLocale(), timezone },
    },
  });

  if (error) return { status: "error", error: authErrorKey(error), values };

  // Email confirmation off: Supabase already returns a session.
  if (data.session) redirect("/onboarding");

  // Same answer for new and existing emails: Supabase doesn't reveal which, and neither do we.
  return { status: "success" };
}

export async function signIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: field(formData, "email"),
    password: field(formData, "password"),
  });
  const values = { email: field(formData, "email") };
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: fieldErrorsOf(parsed.error),
      values,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { status: "error", error: authErrorKey(error), values };

  const { error: loginError } = await supabase
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", data.user.id);
  // Bookkeeping only: never block a valid sign-in because of it.
  if (loginError)
    console.error("Could not save last login", data.user.id, loginError);

  // src/proxy.ts sends users who haven't finished onboarding to /onboarding.
  redirect(safeRedirectPath(field(formData, "next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: field(formData, "email"),
  });
  const values = { email: field(formData, "email") };
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: fieldErrorsOf(parsed.error),
      values,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: authCallbackUrl("/reset-password"),
    },
  );

  // Only a rate limit is worth telling: anything else would reveal whether the account exists.
  if (error) {
    if (authErrorKey(error) === "rateLimited") {
      return { status: "error", error: "rateLimited", values };
    }
    console.error("Password reset request failed", error.code);
  }
  return { status: "success" };
}

export async function updatePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // The recovery link signs the user in through /auth/callback; without that session, back to login.
  await requireUser();

  const parsed = resetPasswordSchema.safeParse({
    password: field(formData, "password"),
    confirmPassword: field(formData, "confirmPassword"),
  });
  if (!parsed.success)
    return { status: "error", fieldErrors: fieldErrorsOf(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { status: "error", error: authErrorKey(error) };

  redirect("/dashboard");
}
