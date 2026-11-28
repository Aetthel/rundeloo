"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { PIPELINE_FUNNEL } from "@/lib/constants";
import { fieldErrorsOf, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import {
  type ApplicationInput,
  applicationSchema,
} from "@/lib/validations/application";
import { idSchema } from "@/lib/validations/company";
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

const FIELDS = [
  "companyId",
  "roleTitle",
  "status",
  "workMode",
  "appliedAt",
  "deadline",
  "jobUrl",
] as const;

function readApplication(formData: FormData) {
  return Object.fromEntries(
    FIELDS.map((name) => {
      const value = formData.get(name);
      return [name, typeof value === "string" ? value : ""];
    }),
  );
}

/** Success carries the saved values, so the table updates without a reload. */
export type SaveApplicationState =
  | Exclude<FormState, { status: "success" }>
  | { status: "success"; saved: ApplicationInput };

/** Bound to the application id in the edit popup of the table. */
export async function updateApplication(
  id: string,
  _prev: SaveApplicationState,
  formData: FormData,
): Promise<SaveApplicationState> {
  const values = readApplication(formData);
  if (!idSchema.safeParse(id).success) {
    return { status: "error", error: "notFound", values };
  }
  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: fieldErrorsOf(parsed.error),
      values,
    };
  }
  const saved = parsed.data;

  // Dev preview without a session: the table keeps the change locally only.
  if (await servePreviewData()) return { status: "success", saved };

  const user = await requireUser();
  const supabase = await createClient();
  // RLS hides other users' rows, so this also checks ownership.
  const { data: current, error: readError } = await supabase
    .from("applications")
    .select("status, company_id")
    .eq("id", id)
    .maybeSingle();
  if (readError) {
    console.error("Could not read application", user.id, readError.code);
    return { status: "error", error: "saveFailed", values };
  }
  if (!current) return { status: "error", error: "notFound", values };

  const { error } = await supabase
    .from("applications")
    .update({
      company_id: saved.companyId,
      role_title: saved.roleTitle,
      status: saved.status,
      work_mode: saved.workMode,
      applied_at: saved.appliedAt,
      deadline: saved.deadline,
      job_url: saved.jobUrl,
      // Only a real status change moves the card on the board.
      ...(saved.status !== current.status && {
        status_changed_at: new Date().toISOString(),
      }),
    })
    .eq("id", id);

  if (error) {
    // A company id that isn't the user's fails the foreign key or RLS check.
    console.error("Could not update application", user.id, error.code);
    return { status: "error", error: "saveFailed", values };
  }

  revalidatePath("/applications");
  revalidatePath(`/companies/${current.company_id}`);
  if (saved.companyId !== current.company_id) {
    revalidatePath(`/companies/${saved.companyId}`);
  }
  return { status: "success", saved };
}

/** Deletes an application; its status history goes with it (cascade). */
export async function deleteApplication(id: string): Promise<FormState> {
  if (!idSchema.safeParse(id).success) {
    return { status: "error", error: "notFound" };
  }
  if (await servePreviewData()) return { status: "success" };

  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .select("company_id");

  if (error) {
    console.error("Could not delete application", user.id, error.code);
    return { status: "error", error: "deleteFailed" };
  }
  if (!data.length) return { status: "error", error: "notFound" };

  revalidatePath("/applications");
  revalidatePath(`/companies/${data[0].company_id}`);
  return { status: "success" };
}
