import "server-only";

import { cache } from "react";

import { bestStage, latestDate, stageRank } from "@/lib/companies";
import type { ApplicationStatus } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth/session";
import { companyLogos } from "@/server/companies/favicon";
import { previewCompanies } from "@/server/companies/preview-data";
import { servePreviewData } from "@/server/preview";
import type { Database } from "@/types/database";

type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
export type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];

export type CompanyListItem = Pick<
  CompanyRow,
  "id" | "name" | "industry" | "location" | "website"
> & {
  logo: string | null;
  bestStage: ApplicationStatus | null;
  applicationsCount: number;
  contactsCount: number;
  lastActivity: string | null;
};

/**
 * Companies table (screen 13). Derived columns are computed here from the
 * related rows; RLS limits everything to the signed-in user.
 * Sorted by best stage, then most recent activity.
 */
export async function listCompanies(): Promise<CompanyListItem[]> {
  const data = (await servePreviewData())
    ? previewCompanies().map((c) => ({
        ...c,
        applications: c.applications.map((a) => ({
          status: a.status,
          updated_at: a.status_changed_at ?? c.updated_at,
        })),
      }))
    : await fetchCompanies();

  // Cached per host, so after the first visit this is instant.
  const logos = await companyLogos(data.map((c) => c.website));

  return data
    .map((company, index) => ({
      id: company.id,
      name: company.name,
      industry: company.industry,
      location: company.location,
      website: company.website,
      logo: logos[index] ?? null,
      bestStage: bestStage(company.applications.map((a) => a.status)),
      applicationsCount: company.applications.length,
      contactsCount: company.contacts.length,
      lastActivity: latestDate([
        company.updated_at,
        ...company.applications.map((a) => a.updated_at),
        ...company.contacts.map((c) => c.updated_at),
      ]),
    }))
    .sort(
      (a, b) =>
        stageRank(a.bestStage) - stageRank(b.bestStage) ||
        (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""),
    );
}

async function fetchCompanies() {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select(
      "id, name, industry, location, website, created_at, updated_at, applications(status, updated_at), contacts(updated_at)",
    );
  if (error) throw new Error("Could not load companies", { cause: error });
  return data;
}

export type CompanyDetail = CompanyRow & {
  applications: {
    id: string;
    role_title: string;
    status: ApplicationStatus;
    status_changed_at: string | null;
  }[];
  contacts: ContactRow[];
};

/**
 * One company with its applications and contacts (screen 14). Memoized per
 * request: the layout and the tab pages share it. Null when it doesn't exist
 * or belongs to someone else (RLS returns no row).
 */
export const getCompany = cache(
  async (id: string): Promise<CompanyDetail | null> => {
    if (await servePreviewData()) {
      return previewCompanies().find((c) => c.id === id) ?? null;
    }
    await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("companies")
      .select(
        "*, applications(id, role_title, status, status_changed_at), contacts(*)",
      )
      .eq("id", id)
      .order("full_name", { referencedTable: "contacts" })
      .maybeSingle();
    if (error) throw new Error("Could not load company", { cause: error });
    return data;
  },
);
