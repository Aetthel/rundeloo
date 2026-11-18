"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { FormField } from "@/components/auth/form-field";
import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { useErrorText } from "@/components/auth/use-error-text";
import { IDLE } from "@/lib/form-state";
import { requestPasswordReset } from "@/server/auth/actions";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const errorText = useErrorText();
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    IDLE,
  );

  // Shown whether or not the account exists, so the form can't be used to probe emails.
  if (state.status === "success") {
    return (
      <FormMessage
        tone="info"
        title={t("forgot.sentTitle")}
        message={t("forgot.sentBody")}
      />
    );
  }

  const error = state.status === "error" ? state : undefined;

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <FormMessage message={errorText(error?.error)} />
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
      <SubmitButton
        pending={pending}
        label={t("forgot.submit")}
        pendingLabel={t("forgot.pending")}
      />
    </form>
  );
}
