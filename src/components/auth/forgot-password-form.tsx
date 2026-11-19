"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { AuthSplitCard } from "@/components/auth/auth-split-card";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { SubmitButton } from "@/components/shared/submit-button";
import { useErrorText } from "@/components/shared/use-error-text";
import { IDLE } from "@/lib/form-state";
import { requestPasswordReset } from "@/server/auth/actions";

/** Same card as sign-in, reduced to one field: no social buttons, no legal text. */
export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const errorText = useErrorText();
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    IDLE,
  );

  const backToLogin = (
    <Link
      href="/login"
      className="mx-auto inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {t("forgot.back")}
    </Link>
  );

  // Shown whether or not the account exists, so the form can't be used to probe emails.
  if (state.status === "success") {
    return (
      <AuthSplitCard
        title={t("forgot.sentTitle")}
        subtitle={t("forgot.sentBody")}
        legal={false}
      >
        {backToLogin}
      </AuthSplitCard>
    );
  }

  const error = state.status === "error" ? state : undefined;

  return (
    <AuthSplitCard
      title={t("forgot.title")}
      subtitle={t("forgot.subtitle")}
      action={formAction}
      legal={false}
    >
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
      {backToLogin}
    </AuthSplitCard>
  );
}
