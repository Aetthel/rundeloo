import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { requireUser } from "@/server/auth/session";

/** Reached from the recovery email through /auth/callback, which signs the user in. */
export default async function ResetPasswordPage() {
  await requireUser();
  const t = await getTranslations("auth");

  return (
    <AuthCard title={t("reset.title")} description={t("reset.subtitle")}>
      <ResetPasswordForm />
    </AuthCard>
  );
}
