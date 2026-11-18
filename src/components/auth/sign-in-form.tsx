"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { FormField } from "@/components/auth/form-field";
import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { useErrorText } from "@/components/auth/use-error-text";
import { IDLE } from "@/lib/form-state";
import { signIn } from "@/server/auth/actions";

/** `next` is the protected page to return to; the server checks it is an internal path. */
export function SignInForm({
  next,
  initialError,
}: {
  next?: string;
  initialError?: string;
}) {
  const t = useTranslations("auth");
  const errorText = useErrorText();
  const [state, formAction, pending] = useActionState(signIn, IDLE);

  const error = state.status === "error" ? state : undefined;
  // A failed email link lands here with ?error=…, until the first submit replaces it.
  const formError = state.status === "idle" ? initialError : error?.error;

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <FormMessage message={errorText(formError)} />
      {next && <input type="hidden" name="next" value={next} />}
      <FormField
        name="email"
        type="email"
        label={t("fields.email")}
        placeholder={t("fields.emailPlaceholder")}
        autoComplete="email"
        required
        defaultValue={error?.values?.email}
        error={errorText(error?.fieldErrors?.email)}
      />
      <FormField
        name="password"
        type="password"
        label={t("fields.password")}
        autoComplete="current-password"
        required
        error={errorText(error?.fieldErrors?.password)}
        labelAction={
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("signIn.forgot")}
          </Link>
        }
      />
      <SubmitButton
        pending={pending}
        label={t("signIn.submit")}
        pendingLabel={t("signIn.pending")}
      />
    </form>
  );
}
