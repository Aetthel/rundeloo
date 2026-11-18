import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";

// Only known values from /auth/callback become a message; anything else in the URL is ignored.
const CALLBACK_ERRORS: Record<string, string> = {
  auth_callback: "authCallback",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const [t, params] = await Promise.all([
    getTranslations("auth"),
    searchParams,
  ]);
  const next = typeof params.next === "string" ? params.next : undefined;
  const error =
    typeof params.error === "string"
      ? CALLBACK_ERRORS[params.error]
      : undefined;

  return (
    <AuthCard
      title={t("signIn.title")}
      description={t("signIn.subtitle")}
      footer={
        <>
          {t("signIn.noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium underline-offset-4 hover:underline"
          >
            {t("signIn.signUp")}
          </Link>
        </>
      }
    >
      <SignInForm next={next} initialError={error} />
    </AuthCard>
  );
}
