import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");

  return (
    <AuthCard
      title={t("forgot.title")}
      description={t("forgot.subtitle")}
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("forgot.back")}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
