import { SignUpForm } from "@/components/auth/sign-up-form";

/** Layout from the shadcn signup-04 block: form and brand panel side by side. */
export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm md:max-w-4xl">
      <SignUpForm />
    </div>
  );
}
