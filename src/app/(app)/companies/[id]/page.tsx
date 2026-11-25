import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { type ReactNode, Suspense } from "react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { bestStage, displayHost, initialsOf } from "@/lib/companies";
import { PIPELINE_PRIORITY } from "@/lib/constants";
import { loadCompanyOr404 } from "@/server/companies/load";

const SIDE_CONTACTS = 3;
const ACTIVITY_ITEMS = 6;

/**
 * Applications tab of a company (default tab). Two containers only: the main
 * one (stat strip + applications) and the side one (about, notes, contacts).
 */
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
  const [company, t, tRole, tStatus, format] = await Promise.all([
    loadCompanyOr404(params),
    getTranslations("companies.detail"),
    getTranslations("enums.contactRole"),
    getTranslations("enums.applicationStatus"),
    getFormatter(),
  ]);

  // Pipeline order from constants, never the enum order.
  const applications = [...company.applications].sort(
    (a, b) =>
      PIPELINE_PRIORITY.indexOf(a.status) - PIPELINE_PRIORITY.indexOf(b.status),
  );
  const best = bestStage(applications.map((a) => a.status));
  const now = new Date();
  // Activity derived from data we already have, newest first.
  const activity = [
    ...company.applications
      .filter((app) => app.status_changed_at)
      .map((app) => ({
        id: `app-${app.id}`,
        at: app.status_changed_at as string,
        text: t("activityStatus", {
          role: app.role_title,
          status: tStatus(app.status),
        }),
      })),
    ...company.contacts.map((contact) => ({
      id: `contact-${contact.id}`,
      at: contact.created_at,
      text: t("activityContact", { name: contact.full_name }),
    })),
    { id: "company", at: company.created_at, text: t("activityCompany") },
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, ACTIVITY_ITEMS);
  const muted = (text: string) => (
    <p className="text-sm text-muted-foreground">{text}</p>
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section
        aria-label={t("applications")}
        className="overflow-hidden rounded-xl border surface"
      >
        <dl className="grid grid-cols-2 border-b sm:grid-cols-4">
          <Stat label={t("applications")}>
            <span className="font-mono">{applications.length}</span>
          </Stat>
          <Stat label={t("bestStage")}>
            {best ? (
              <StatusBadge status={best} className="text-sm" />
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Stat>
          <Stat label={t("contacts")}>
            <span className="font-mono">{company.contacts.length}</span>
          </Stat>
          <Stat label={t("nextInterview")}>
            <span className="text-muted-foreground">{t("notScheduled")}</span>
          </Stat>
        </dl>

        <div className="p-4 pb-2">
          <h2 className="text-sm font-medium">{t("applications")}</h2>
        </div>
        {applications.length === 0 ? (
          <div className="px-4 pb-4">{muted(t("applicationsEmpty"))}</div>
        ) : (
          <ul className="divide-y border-t">
            {applications.map((app) => (
              <li key={app.id} className="relative">
                <div className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50">
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    {/* Stretched link: the whole row is clickable, reached once by keyboard. */}
                    <Link
                      href={`/applications/${app.id}`}
                      className="truncate font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
                    >
                      {app.role_title}
                    </Link>
                    {app.status_changed_at && (
                      <span className="text-xs text-muted-foreground">
                        {t("updatedAgo", {
                          time: format.relativeTime(
                            new Date(app.status_changed_at),
                            now,
                          ),
                        })}
                      </span>
                    )}
                  </div>
                  <StatusBadge status={app.status} />
                  <ChevronRight
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t p-4">
          <h2 className="mb-3 text-sm font-medium">{t("activity")}</h2>
          <ol className="grid gap-3">
            {activity.map((event) => (
              <li key={event.id} className="flex items-baseline gap-3 text-sm">
                <span
                  className="size-1.5 shrink-0 -translate-y-px rounded-full bg-muted-foreground/60"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{event.text}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {format.relativeTime(new Date(event.at), now)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <aside
        aria-label={t("summary")}
        className="divide-y overflow-hidden rounded-xl border surface lg:sticky lg:top-20"
      >
        <SideSection title={t("about")}>
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
        </SideSection>

        <SideSection title={t("notes")}>
          {company.notes ? (
            <p className="text-sm whitespace-pre-wrap">{company.notes}</p>
          ) : (
            muted(t("notesEmpty"))
          )}
        </SideSection>

        <SideSection
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
            muted(t("contactsEmpty"))
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
        </SideSection>
      </aside>
    </div>
  );
}

/** One cell of the stat strip: mono label on top, value below. */
function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 px-4 py-3 odd:border-r sm:border-r sm:last:border-r-0 [&:nth-child(-n+2)]:border-b sm:[&:nth-child(-n+2)]:border-b-0">
      <dt className="font-mono text-2xs tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-lg font-medium">{children}</dd>
    </div>
  );
}

/** A section inside the side container, divided from the next by a rule. */
function SideSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
