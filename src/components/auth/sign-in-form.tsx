"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { AuthLogo } from "@/components/auth/auth-logo";
import { BrandPanel } from "@/components/auth/brand-panel";
import { FormField } from "@/components/auth/form-field";
import { FormMessage } from "@/components/auth/form-message";
import { SocialButtons } from "@/components/auth/social-buttons";
import { SubmitButton } from "@/components/auth/submit-button";
import { useErrorText } from "@/components/auth/use-error-text";
import { Card, CardContent } from "@/components/ui/card";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { IDLE } from "@/lib/form-state";
import { signIn } from "@/server/auth/actions";

const linkClass = "underline underline-offset-4 hover:text-foreground";

/** shadcn login-04: form left, brand panel right (hidden on mobile), legal text below. */
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
    <div className="flex flex-col gap-6">
      {/* The brand panel is hidden below md, so the logo moves above the card. */}
      <div className="flex justify-center md:hidden">
        <AuthLogo />
      </div>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form action={formAction} className="p-6 md:p-8" noValidate>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">{t("signIn.title")}</h1>
                <p className="text-balance text-muted-foreground">
                  {t("signIn.subtitle")}
                </p>
              </div>
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
                <Link href="/register" className={linkClass}>
                  {t("signIn.signUp")}
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <BrandPanel />
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        {t.rich("signIn.legal", {
          terms: (chunks) => (
            <Link href="/terms" className={linkClass}>
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link href="/privacy" className={linkClass}>
              {chunks}
            </Link>
          ),
        })}
      </FieldDescription>
    </div>
  );
}
