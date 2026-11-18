import { SignInForm } from "@/components/auth/sign-in-form";

// Only known values from /auth/callback become a message; anything else in the URL is ignored.
const CALLBACK_ERRORS: Record<string, string> = {
  auth_callback: "authCallback",
};

/** Layout from the shadcn login-04 block: form and brand panel side by side. */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const error =
    typeof params.error === "string"
      ? CALLBACK_ERRORS[params.error]
      : undefined;

  return (
    <div className="w-full max-w-sm md:max-w-4xl">
      <SignInForm next={next} initialError={error} />
    </div>
  );
}
