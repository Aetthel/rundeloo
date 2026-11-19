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
import { FieldDescription } from "@/components/ui/field";
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
    <AuthSplitCard
      title={t("signIn.title")}
      subtitle={t("signIn.subtitle")}
      action={formAction}
    >
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
            className="text-sm underline-offset-2 hover:underline"
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
      <SocialButtons />
      <FieldDescription className="text-center">
        {t("signIn.noAccount")}{" "}
        <Link href="/register" className={authLinkClass}>
          {t("signIn.signUp")}
        </Link>
      </FieldDescription>
    </AuthSplitCard>
  );
}
