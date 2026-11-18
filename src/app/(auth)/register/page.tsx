import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default async function RegisterPage() {
  const t = await getTranslations("auth");

  return (
    <AuthCard
      title={t("signUp.title")}
      description={t("signUp.subtitle")}
      footer={
        <>
          {t("signUp.haveAccount")}{" "}
          <Link
            href="/login"
            className="font-medium underline-offset-4 hover:underline"
          >
            {t("signUp.logIn")}
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
