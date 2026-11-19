import "server-only";

import { cache } from "react";

import { isAuthPreview } from "@/lib/dev-preview";
import { createClient } from "@/lib/supabase/server";
import { getUser, requireUser } from "@/server/auth/session";
import { hasProAccess } from "@/server/billing";

export type ShellUser = {
  name: string | null;
  email: string;
  isPro: boolean;
};

const PREVIEW_USER: ShellUser = {
  name: "Preview",
  email: "preview@localhost",
  isPro: false,
};

/** What the app shell shows about the signed-in user. Memoized per request. */
export const getShellUser = cache(async (): Promise<ShellUser> => {
  // Dev-only UI preview without a session (see src/lib/dev-preview.ts).
  if (isAuthPreview() && !(await getUser())) return PREVIEW_USER;

  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: profile }, isPro] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle(),
    hasProAccess(user.id),
  ]);

  return {
    name: profile?.full_name ?? null,
    email: user.email ?? "",
    isPro,
  };
});
