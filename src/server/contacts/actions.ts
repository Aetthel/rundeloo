"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { fieldErrorsOf, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { contactSchema, idSchema } from "@/lib/validations/company";
import { requireUser } from "@/server/auth/session";

const FIELDS = [
  "fullName",
  "contactRole",
  "email",
  "phone",
  "linkedinUrl",
  "notes",
] as const;

function readContact(formData: FormData) {
  return Object.fromEntries(
    FIELDS.map((name) => {
      const value = formData.get(name);
      return [name, typeof value === "string" ? value : ""];
    }),
  );
}

function parse(formData: FormData) {
  const parsed = contactSchema.safeParse(readContact(formData));
  if (!parsed.success) {
    return {
      ok: false as const,
      state: {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error),
        values: readContact(formData),
      } satisfies FormState,
    };
  }
  const c = parsed.data;
  return {
    ok: true as const,
    row: {
      full_name: c.fullName,
      contact_role: c.contactRole,
      email: c.email,
      phone: c.phone,
      linkedin_url: c.linkedinUrl,
      notes: c.notes,
    },
  };
}

const refresh = (companyId: string) =>
  revalidatePath(`/companies/${companyId}`, "layout");

/**
 * Bound to the company id. The contacts RLS policy only accepts a company_id
 * the user owns, so a forged id fails the insert.
 */
export async function createContact(
  companyId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (!idSchema.safeParse(companyId).success) {
    return { status: "error", error: "notFound" };
  }
  const result = parse(formData);
  if (!result.ok) return result.state;

  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .insert({ ...result.row, company_id: companyId });

  if (error) {
    console.error("Could not create contact", user.id, error.code);
    return {
      status: "error",
      error: "saveFailed",
      values: readContact(formData),
    };
  }

  refresh(companyId);
  return { status: "success" };
}

/** Bound to the contact and company ids in the edit sheet. */
export async function updateContact(
  ids: { contactId: string; companyId: string },
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (
    !idSchema.safeParse(ids.contactId).success ||
    !idSchema.safeParse(ids.companyId).success
  ) {
    return { status: "error", error: "notFound" };
  }
  const result = parse(formData);
  if (!result.ok) return result.state;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .update(result.row)
    .eq("id", ids.contactId)
    .select("id");

  if (error) {
    console.error("Could not update contact", user.id, error.code);
    return {
      status: "error",
      error: "saveFailed",
      values: readContact(formData),
    };
  }
  if (!data.length) return { status: "error", error: "notFound" };

  refresh(ids.companyId);
  return { status: "success" };
}

export async function deleteContact(ids: {
  contactId: string;
  companyId: string;
}): Promise<FormState> {
  const user = await requireUser();
  if (
    !idSchema.safeParse(ids.contactId).success ||
    !idSchema.safeParse(ids.companyId).success
  ) {
    return { status: "error", error: "notFound" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", ids.contactId)
    .select("id");

  if (error) {
    console.error("Could not delete contact", user.id, error.code);
    return { status: "error", error: "deleteFailed" };
  }
  if (!data.length) return { status: "error", error: "notFound" };

  refresh(ids.companyId);
  return { status: "success" };
}
