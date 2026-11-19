import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

/** Shorter sibling of the login card: one field, slightly narrower. */
export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm md:max-w-3xl">
      <ForgotPasswordForm />
    </div>
  );
}
