import "server-only";

import type { ApplicationStatus, WorkMode } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth/session";
import { companyLogos } from "@/server/companies/favicon";
import { previewForLocale } from "@/server/companies/queries";
import { servePreviewData } from "@/server/preview";

export type ApplicationCard = {
  id: string;
  roleTitle: string;
  status: ApplicationStatus;
  statusChangedAt: string | null;
  jobUrl: string | null;
  workMode: WorkMode | null;
  appliedAt: string | null;
  /** ISO date (YYYY-MM-DD). */
  deadline: string | null;
  company: { id: string; name: string; logo: string | null };
};

/**
 * Every application of the signed-in user with its company, for the board
 * (screen 08). Newest status change first; the board groups them by status.
 * RLS limits the rows to the user.
 */
export async function listApplications(): Promise<ApplicationCard[]> {
  const rows = (await servePreviewData())
    ? await previewRows()
    : await fetchRows();

  // Cached per host, so after the first visit this is instant.
  const logos = await companyLogos(rows.map((row) => row.company.website));

  return rows
    .map((row, index) => ({
      id: row.id,
      roleTitle: row.role_title,
      status: row.status,
      statusChangedAt: row.status_changed_at,
      jobUrl: row.job_url,
      workMode: row.work_mode,
      appliedAt: row.applied_at,
      deadline: row.deadline,
      company: {
        id: row.company.id,
        name: row.company.name,
        logo: logos[index] ?? null,
      },
    }))
    .sort((a, b) =>
      (b.statusChangedAt ?? "").localeCompare(a.statusChangedAt ?? ""),
    );
}

type Row = {
  id: string;
  role_title: string;
  status: ApplicationStatus;
  status_changed_at: string | null;
  job_url: string | null;
  work_mode: WorkMode | null;
  applied_at: string | null;
  deadline: string | null;
  company: { id: string; name: string; website: string | null };
};

async function fetchRows(): Promise<Row[]> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, role_title, status, status_changed_at, job_url, work_mode, applied_at, deadline, company:companies!inner(id, name, website)",
    );
  if (error) throw error;
  return data;
}

async function previewRows(): Promise<Row[]> {
  const companies = await previewForLocale();
  return companies.flatMap((company) =>
    company.applications.map((app) => ({
      id: app.id,
      role_title: app.role_title,
      status: app.status,
      status_changed_at: app.status_changed_at,
      job_url: app.job_url,
      work_mode: app.work_mode,
      applied_at: app.applied_at,
      deadline: app.deadline,
      company: {
        id: company.id,
        name: company.name,
        website: company.website,
      },
    })),
  );
}
