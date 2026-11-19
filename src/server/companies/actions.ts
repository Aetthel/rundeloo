"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fieldErrorsOf, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { companySchema, idSchema } from "@/lib/validations/company";
import { requireUser } from "@/server/auth/session";

const FIELDS = ["name", "website", "industry", "location", "notes"] as const;

function readCompany(formData: FormData) {
  return Object.fromEntries(
    FIELDS.map((name) => {
      const value = formData.get(name);
      return [name, typeof value === "string" ? value : ""];
    }),
  );
}

function failed(formData: FormData, error: string): FormState {
  return { status: "error", error, values: readCompany(formData) };
}

/** Creates a company and opens its detail page. */
export async function createCompany(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = companySchema.safeParse(readCompany(formData));
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: fieldErrorsOf(parsed.error),
      values: readCompany(formData),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .insert({ ...parsed.data, user_id: user.id })
    .select("id")
    .single();

  if (error) {
    console.error("Could not create company", user.id, error.code);
    return failed(formData, "saveFailed");
  }

  revalidatePath("/companies");
  redirect(`/companies/${data.id}`);
}

/** Bound to the company id in the edit sheet. */
export async function updateCompany(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (!idSchema.safeParse(id).success) return failed(formData, "notFound");

  const parsed = companySchema.safeParse(readCompany(formData));
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: fieldErrorsOf(parsed.error),
      values: readCompany(formData),
    };
  }

  const supabase = await createClient();
  // RLS makes another user's company invisible: zero rows updated means not found.
  const { data, error } = await supabase
    .from("companies")
    .update(parsed.data)
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("Could not update company", user.id, error.code);
    return failed(formData, "saveFailed");
  }
  if (!data.length) return failed(formData, "notFound");

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`, "layout");
  return { status: "success" };
}

/** Deletes a company; its applications and contacts go with it (on delete cascade). */
export async function deleteCompany(id: string): Promise<FormState> {
  const user = await requireUser();
  if (!idSchema.safeParse(id).success) {
    return { status: "error", error: "notFound" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("Could not delete company", user.id, error.code);
    return { status: "error", error: "deleteFailed" };
  }
  if (!data.length) return { status: "error", error: "notFound" };

  revalidatePath("/companies");
  redirect("/companies");
}
