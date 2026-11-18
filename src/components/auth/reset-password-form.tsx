"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { FormField } from "@/components/auth/form-field";
import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { useErrorText } from "@/components/auth/use-error-text";
import { IDLE } from "@/lib/form-state";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/validations/auth";
import { updatePassword } from "@/server/auth/actions";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const errorText = useErrorText();
  const [state, formAction, pending] = useActionState(updatePassword, IDLE);
  const error = state.status === "error" ? state : undefined;

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <FormMessage message={errorText(error?.error)} />
      <FormField
        name="password"
        type="password"
        label={t("fields.newPassword")}
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={PASSWORD_MAX_LENGTH}
        hint={t("fields.passwordHint")}
        error={errorText(error?.fieldErrors?.password)}
      />
      <FormField
        name="confirmPassword"
        type="password"
        label={t("fields.confirmPassword")}
        autoComplete="new-password"
        required
        maxLength={PASSWORD_MAX_LENGTH}
        error={errorText(error?.fieldErrors?.confirmPassword)}
      />
      <SubmitButton
        pending={pending}
        label={t("reset.submit")}
        pendingLabel={t("reset.pending")}
      />
    </form>
  );
}
