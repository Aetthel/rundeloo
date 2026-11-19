import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { requireUser } from "@/server/auth/session";

/** Reached from the recovery email through /auth/callback, which signs the user in. */
export default async function ResetPasswordPage() {
  await requireUser();

  return (
    <div className="w-full max-w-sm md:max-w-3xl">
      <ResetPasswordForm />
    </div>
  );
}
