"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { PIPELINE_FUNNEL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth/session";
import { servePreviewData } from "@/server/preview";

const moveSchema = z.object({
  id: z.uuid(),
  status: z.enum(PIPELINE_FUNNEL as [string, ...string[]]),
});

export type MoveResult = { ok: true } | { ok: false; error: string };

/**
 * Moves an application to another board column. The status history row is
 * written by the database trigger; this only stamps status_changed_at.
 */
export async function moveApplication(
  id: string,
  status: string,
): Promise<MoveResult> {
  const parsed = moveSchema.safeParse({ id, status });
  if (!parsed.success) return { ok: false, error: "notFound" };

  // Dev preview without a session: the board keeps the move in local state only.
  if (await servePreviewData()) return { ok: true };

  const user = await requireUser();
  const supabase = await createClient();
  // RLS hides other users' applications: zero rows updated means not found.
  const { data, error } = await supabase
    .from("applications")
    .update({
      status: parsed.data.status as (typeof PIPELINE_FUNNEL)[number],
      status_changed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .select("company_id");

  if (error) {
    console.error("Could not move application", user.id, error.code);
    return { ok: false, error: "saveFailed" };
  }
  if (data.length === 0) return { ok: false, error: "notFound" };

  revalidatePath("/applications");
  revalidatePath(`/companies/${data[0].company_id}`);
  return { ok: true };
}
