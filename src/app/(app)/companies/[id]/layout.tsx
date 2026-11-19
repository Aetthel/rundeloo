import { ExternalLink, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CompanyActions } from "@/components/companies/company-actions";
import { CompanyLogo } from "@/components/companies/company-logo";
import { CompanyTabs } from "@/components/companies/company-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { displayHost } from "@/lib/companies";
import { companyLogo } from "@/server/companies/favicon";
import { loadCompanyOr404 } from "@/server/companies/load";

/** Screen 14 header and tabs, shared by the Applications, Contacts and Notes tabs. */
export default function CompanyDetailLayout({
  children,
  params,
}: LayoutProps<"/companies/[id]">) {
  return (
    <div className="grid gap-6">
      <Suspense fallback={<HeaderSkeleton />}>
        <CompanyHeader params={params} />
      </Suspense>
      {children}
    </div>
  );
}

async function CompanyHeader({ params }: { params: Promise<{ id: string }> }) {
  const [company, t] = await Promise.all([
    loadCompanyOr404(params),
    getTranslations("companies.detail"),
  ]);
  const logo = await companyLogo(company.website);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <CompanyLogo name={company.name} logo={logo} size="lg" />
          <div className="grid min-w-0 gap-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {company.name}
            </h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline"
                >
                  {displayHost(company.website)}
                  <ExternalLink className="size-3" aria-hidden />
                  <span className="sr-only">{t("visitWebsite")}</span>
                </a>
              )}
              {company.industry && <span>{company.industry}</span>}
              {company.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" aria-hidden />
                  {company.location}
                </span>
              )}
            </p>
          </div>
        </div>
        <CompanyActions
          // Only the editable fields cross to the client component.
          company={{
            id: company.id,
            name: company.name,
            website: company.website,
            industry: company.industry,
            location: company.location,
            notes: company.notes,
          }}
          applicationsCount={company.applications.length}
          contactsCount={company.contacts.length}
        />
      </div>
      <CompanyTabs
        companyId={company.id}
        counts={{
          applications: company.applications.length,
          contacts: company.contacts.length,
          // Linked notes arrive with the notes editor (task 11).
          notes: 0,
        }}
      />
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-lg" />
        <div className="grid gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-9 w-80" />
    </div>
  );
}
