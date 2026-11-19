import "server-only";

import { notFound } from "next/navigation";

import { idSchema } from "@/lib/validations/company";
import { getCompany } from "@/server/companies/queries";

/**
 * Company for the detail routes: 404 for malformed ids (they would make the
 * uuid query fail) and for companies that don't exist or aren't the user's.
 */
export async function loadCompanyOr404(params: Promise<{ id: string }>) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const company = await getCompany(id);
  if (!company) notFound();
  return company;
}
