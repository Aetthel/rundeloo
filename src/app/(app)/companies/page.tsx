import { Building2, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CompaniesTable } from "@/components/companies/companies-table";
import { CompanyFormDialog } from "@/components/companies/company-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listCompanies } from "@/server/companies/queries";

/** Screen 13. The header renders at once; the table streams in behind Suspense. */
export default async function CompaniesPage() {
  const [t, tNav] = await Promise.all([
    getTranslations("companies.list"),
    getTranslations("nav"),
  ]);

  return (
    <>
      <PageHeader
        title={tNav("items.companies")}
        description={t("description")}
        actions={<AddCompanyButton label={t("add")} />}
      />
      <Suspense fallback={<TableSkeleton />}>
        <CompaniesData />
      </Suspense>
    </>
  );
}

function AddCompanyButton({ label }: { label: string }) {
  return (
    <CompanyFormDialog
      trigger={
        <Button>
          <Plus aria-hidden />
          {label}
        </Button>
      }
    />
  );
}

async function CompaniesData() {
  const [t, companies] = await Promise.all([
    getTranslations("companies.list"),
    listCompanies(),
  ]);

  if (companies.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title={t("emptyTitle")}
        description={t("emptyBody")}
        action={<AddCompanyButton label={t("add")} />}
      />
    );
  }

  return <CompaniesTable companies={companies} />;
}

function TableSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
