"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { AuthLogo } from "@/components/auth/auth-logo";
import { BrandPanel } from "@/components/auth/brand-panel";
import { Card, CardContent } from "@/components/ui/card";
import { FieldDescription, FieldGroup } from "@/components/ui/field";

export const authLinkClass =
  "underline underline-offset-4 hover:text-foreground";

/**
 * shadcn login-04 / signup-04 layout shared by sign-in and sign-up: form on the
 * left, brand panel on the right (hidden below md, where the logo moves on top),
 * legal text under the card.
 */
export function AuthSplitCard({
  title,
  subtitle,
  action,
  legal = "signIn",
  children,
}: {
  title: string;
  subtitle: string;
  /** Omit to render the children without a form (e.g. a confirmation message). */
  action?: (formData: FormData) => void;
  /** Legal text under the card; false on screens that don't create or open an account. */
  legal?: "signIn" | "signUp" | false;
  children: ReactNode;
}) {
  const t = useTranslations("auth");

  const body = (
    <FieldGroup className="gap-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-balance text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </FieldGroup>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center md:hidden">
        <AuthLogo />
      </div>
      <Card className="overflow-hidden p-0 ring-2">
        <CardContent className="grid p-0 md:grid-cols-2">
          {action ? (
            <form action={action} className="p-6 md:px-8" noValidate>
              {body}
            </form>
          ) : (
            <div className="p-6 md:px-8">{body}</div>
          )}
          <BrandPanel />
        </CardContent>
      </Card>
      {legal && (
        <FieldDescription className="px-6 text-center">
          {t.rich(`${legal}.legal`, {
            terms: (chunks) => (
              <Link href="/terms" className={authLinkClass}>
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className={authLinkClass}>
                {chunks}
              </Link>
            ),
          })}
        </FieldDescription>
      )}
    </div>
  );
}
