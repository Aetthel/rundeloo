"use server";

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { themeSchema } from "@/lib/validations/account";
import { requireUser } from "@/server/auth/session";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Saves the theme picked in the account menu. The switch itself happens in the
 * browser (next-themes); this only remembers it in profiles.theme.
 */
export async function saveThemePreference(input: unknown): Promise<Result> {
  const user = await requireUser();
  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_theme" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ theme: parsed.data === "system" ? null : parsed.data })
    .eq("user_id", user.id);

  if (error) {
    console.error("Could not save theme", user.id, error.code);
    return { ok: false, error: "save_failed" };
  }
  return { ok: true };
}
