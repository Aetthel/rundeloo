import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { displayHost, initialsOf } from "@/lib/companies";
import { PIPELINE_PRIORITY } from "@/lib/constants";
import { loadCompanyOr404 } from "@/server/companies/load";

const SIDE_CONTACTS = 3;

/** Applications tab of a company (default tab): main column + About and Contacts on the side. */
export default function CompanyOverviewPage({
  params,
}: PageProps<"/companies/[id]">) {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <Overview params={params} />
    </Suspense>
  );
}

async function Overview({ params }: { params: Promise<{ id: string }> }) {
  const [company, t, tRole, format] = await Promise.all([
    loadCompanyOr404(params),
    getTranslations("companies.detail"),
    getTranslations("enums.contactRole"),
    getFormatter(),
  ]);

  // Pipeline order from constants, never the enum order.
  const applications = [...company.applications].sort(
    (a, b) =>
      PIPELINE_PRIORITY.indexOf(a.status) - PIPELINE_PRIORITY.indexOf(b.status),
  );
  const empty = (text: string) => (
    <p className="text-sm text-muted-foreground">{text}</p>
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid gap-6">
        <SectionCard title={t("applications")}>
          {applications.length === 0 ? (
            empty(t("applicationsEmpty"))
          ) : (
            <ul className="divide-y">
              {applications.map((app) => (
                <li
                  key={app.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <Link
                    href={`/applications/${app.id}`}
                    className="truncate font-medium underline-offset-4 hover:underline"
                  >
                    {app.role_title}
                  </Link>
                  <StatusBadge status={app.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
        <SectionCard title={t("nextInterview")}>
          {empty(t("nextInterviewEmpty"))}
        </SectionCard>
        <SectionCard title={t("notes")}>
          {company.notes ? (
            <p className="text-sm whitespace-pre-wrap">{company.notes}</p>
          ) : (
            empty(t("notesEmpty"))
          )}
        </SectionCard>
      </div>

      <aside className="grid gap-6 lg:sticky lg:top-20">
        <SectionCard title={t("about")}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {company.website && (
              <>
                <dt className="text-muted-foreground">{t("website")}</dt>
                <dd className="truncate">
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    {displayHost(company.website)}
                    <span className="sr-only">{t("opensInNewTab")}</span>
                  </a>
                </dd>
              </>
            )}
            {company.industry && (
              <>
                <dt className="text-muted-foreground">{t("industry")}</dt>
                <dd>{company.industry}</dd>
              </>
            )}
            {company.location && (
              <>
                <dt className="text-muted-foreground">{t("location")}</dt>
                <dd>{company.location}</dd>
              </>
            )}
            <dt className="text-muted-foreground">{t("added")}</dt>
            <dd className="font-mono">
              {format.dateTime(new Date(company.created_at), {
                dateStyle: "medium",
              })}
            </dd>
          </dl>
        </SectionCard>
        <SectionCard
          title={t("contacts")}
          action={
            company.contacts.length > 0 && (
              <Link
                href={`/companies/${company.id}/contacts`}
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("viewAll")}
              </Link>
            )
          }
        >
          {company.contacts.length === 0 ? (
            empty(t("contactsEmpty"))
          ) : (
            <ul className="grid gap-3">
              {company.contacts.slice(0, SIDE_CONTACTS).map((contact) => (
                <li key={contact.id} className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs">
                      {initialsOf(contact.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 text-sm">
                    <span className="truncate font-medium">
                      {contact.full_name}
                    </span>
                    {contact.contact_role && (
                      <span className="text-muted-foreground">
                        {tRole(contact.contact_role)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </aside>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid gap-6">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}
