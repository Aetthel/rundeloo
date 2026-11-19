import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";

// Only known values from /auth/callback become a message; anything else in the URL is ignored.
const CALLBACK_ERRORS: Record<string, string> = {
  auth_callback: "authCallback",
};

/**
 * Layout from the shadcn login-04 block. The URL is read behind Suspense so the
 * page shell stays instant (Partial Prefetching): the fallback is the same form
 * without `next` or the callback error, which arrive a moment later.
 */
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="w-full max-w-sm md:max-w-4xl">
      <Suspense fallback={<SignInForm />}>
        <SignInWithParams searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SignInWithParams({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const error =
    typeof params.error === "string"
      ? CALLBACK_ERRORS[params.error]
      : undefined;

  return <SignInForm next={next} initialError={error} />;
}
