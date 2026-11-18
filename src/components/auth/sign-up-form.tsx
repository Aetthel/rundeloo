"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { FormField } from "@/components/auth/form-field";
import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { useErrorText } from "@/components/auth/use-error-text";
import { IDLE, type FormState } from "@/lib/form-state";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/validations/auth";
import { signUp } from "@/server/auth/actions";

type Field = "fullName" | "email" | "password";

export function SignUpForm() {
  const t = useTranslations("auth");
  const errorText = useErrorText();
  const [state, formAction, pending] = useActionState(
    (prev: FormState, formData: FormData) => {
      // The browser knows the user's time zone; profiles.timezone starts from it.
      formData.set(
        "timezone",
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      );
      return signUp(prev, formData);
    },
    IDLE,
  );

  if (state.status === "success") {
    return (
      <FormMessage
        tone="info"
        title={t("signUp.checkEmailTitle")}
        message={t("signUp.checkEmailBody")}
      />
    );
  }

  const error = state.status === "error" ? state : undefined;
  const fieldError = (name: Field) => errorText(error?.fieldErrors?.[name]);

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <FormMessage message={errorText(error?.error)} />
      <FormField
        name="fullName"
        label={t("fields.fullName")}
        placeholder={t("fields.fullNamePlaceholder")}
        autoComplete="name"
        required
        maxLength={100}
        defaultValue={error?.values?.fullName}
        error={fieldError("fullName")}
      />
      <FormField
        name="email"
        type="email"
        label={t("fields.email")}
        placeholder={t("fields.emailPlaceholder")}
        autoComplete="email"
        required
        defaultValue={error?.values?.email}
        error={fieldError("email")}
      />
      <FormField
        name="password"
        type="password"
        label={t("fields.password")}
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={PASSWORD_MAX_LENGTH}
        hint={t("fields.passwordHint")}
        error={fieldError("password")}
      />
      <SubmitButton
        pending={pending}
        label={t("signUp.submit")}
        pendingLabel={t("signUp.pending")}
      />
      <p className="text-center text-xs text-muted-foreground">
        {t.rich("signUp.legal", {
          terms: (chunks) => (
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-foreground"
            >
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-foreground"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}
