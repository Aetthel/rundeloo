"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { AuthSplitCard } from "@/components/auth/auth-split-card";
import { FormField } from "@/components/auth/form-field";
import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { useErrorText } from "@/components/auth/use-error-text";
import { Field, FieldDescription } from "@/components/ui/field";
import { IDLE } from "@/lib/form-state";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/validations/auth";
import { updatePassword } from "@/server/auth/actions";

/** Last step of recovery: same card as sign-up's password row, nothing else. */
export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const errorText = useErrorText();
  const [state, formAction, pending] = useActionState(updatePassword, IDLE);
  const error = state.status === "error" ? state : undefined;

  const passwordProps = {
    type: "password",
    autoComplete: "new-password",
    required: true,
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  } as const;

  return (
    <AuthSplitCard
      title={t("reset.title")}
      subtitle={t("reset.subtitle")}
      action={formAction}
      legal={false}
    >
      <FormMessage message={errorText(error?.error)} />
      <Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            name="password"
            label={t("fields.newPassword")}
            error={errorText(error?.fieldErrors?.password)}
            {...passwordProps}
          />
          <FormField
            name="confirmPassword"
            label={t("fields.confirmPasswordShort")}
            error={errorText(error?.fieldErrors?.confirmPassword)}
            {...passwordProps}
          />
        </div>
        <FieldDescription>{t("fields.passwordHint")}</FieldDescription>
      </Field>
      <SubmitButton
        pending={pending}
        label={t("reset.submit")}
        pendingLabel={t("reset.pending")}
      />
    </AuthSplitCard>
  );
}
