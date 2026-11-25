import { Plus, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ContactFormSheet } from "@/components/companies/contact-form";
import { ContactsList } from "@/components/companies/contacts-list";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { loadCompanyOr404 } from "@/server/companies/load";

/** Contacts tab of a company. */
export default function CompanyContactsPage({
  params,
}: PageProps<"/companies/[id]/contacts">) {
  return (
    <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
      <Contacts params={params} />
    </Suspense>
  );
}

async function Contacts({ params }: { params: Promise<{ id: string }> }) {
  const [company, t] = await Promise.all([
    loadCompanyOr404(params),
    getTranslations("companies.contacts"),
  ]);

  const addButton = (
    <ContactFormSheet
      companyId={company.id}
      trigger={
        <Button>
          <Plus aria-hidden />
          {t("add")}
        </Button>
      }
    />
  );

  if (company.contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={t("emptyTitle")}
        description={t("emptyBody")}
        action={addButton}
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {t("count", { count: company.contacts.length })}
        </p>
        {addButton}
      </div>
      <ContactsList companyId={company.id} contacts={company.contacts} />
    </div>
  );
}
