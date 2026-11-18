"use server";

import "server-only";

import { cookies } from "next/headers";

import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
} from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { localeSchema } from "@/lib/validations/locale";
import { getUser } from "@/server/auth/session";

type SetLocaleResult =
  { ok: true; data: Locale } | { ok: false; error: string };

/**
 * Language switcher. Open to visitors (cookie only); for signed-in users it also
 * saves profiles.language, otherwise src/proxy.ts would restore the old value.
 */
export async function setLocale(input: unknown): Promise<SetLocaleResult> {
  const parsed = localeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_locale" };
  const locale = parsed.data;

  const user = await getUser();
  if (user) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ language: locale })
      .eq("user_id", user.id);

    if (error) {
      console.error("Could not save language", user.id, error);
      return { ok: false, error: "save_failed" };
    }
  }

  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });

  // Writing a cookie in a Server Action already refreshes the current route.
  return { ok: true, data: locale };
}
