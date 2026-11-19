"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import {
  authLinkClass,
  AuthSplitCard,
} from "@/components/auth/auth-split-card";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { SocialButtons } from "@/components/auth/social-buttons";
import { SubmitButton } from "@/components/shared/submit-button";
import { useErrorText } from "@/components/shared/use-error-text";
import { Field, FieldDescription } from "@/components/ui/field";
import { IDLE, type FormState } from "@/lib/form-state";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/validations/auth";
import { signUp } from "@/server/auth/actions";

type FieldName = "fullName" | "email" | "password" | "confirmPassword";

/** shadcn signup-04, plus the full name the onboarding greets the user with. */
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

  const haveAccount = (
    <FieldDescription className="text-center">
      {t("signUp.haveAccount")}{" "}
      <Link href="/login" className={authLinkClass}>
        {t("signUp.logIn")}
      </Link>
    </FieldDescription>
  );

  if (state.status === "success") {
    return (
      <AuthSplitCard
        title={t("signUp.checkEmailTitle")}
        subtitle={t("signUp.checkEmailBody")}
        legal="signUp"
      >
        {haveAccount}
      </AuthSplitCard>
    );
  }

  const error = state.status === "error" ? state : undefined;
  const fieldError = (name: FieldName) => errorText(error?.fieldErrors?.[name]);
  const passwordProps = {
    type: "password",
    autoComplete: "new-password",
    required: true,
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  } as const;

  return (
    <AuthSplitCard
      title={t("signUp.title")}
      subtitle={t("signUp.subtitle")}
      action={formAction}
      legal="signUp"
    >
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
      <Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            name="password"
            label={t("fields.password")}
            error={fieldError("password")}
            {...passwordProps}
          />
          <FormField
            name="confirmPassword"
            label={t("fields.confirmPasswordShort")}
            error={fieldError("confirmPassword")}
            {...passwordProps}
          />
        </div>
        <FieldDescription>{t("fields.passwordHint")}</FieldDescription>
      </Field>
      <SubmitButton
        pending={pending}
        label={t("signUp.submit")}
        pendingLabel={t("signUp.pending")}
      />
      <SocialButtons />
      {haveAccount}
    </AuthSplitCard>
  );
}
