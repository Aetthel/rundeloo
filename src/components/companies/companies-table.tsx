"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useDeferredValue, useState } from "react";

import { CompanyLogo } from "@/components/companies/company-logo";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CompanyListItem } from "@/server/companies/queries";

/** Companies table (screen 13) with a client-side name filter. Rows link to the detail. */
export function CompaniesTable({
  companies,
}: {
  companies: CompanyListItem[];
}) {
  const t = useTranslations("companies.list");
  const format = useFormatter();
  // One clock for every row, so relative times don't drift between renders.
  const now = useNow({ updateInterval: 60_000 });
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  // Visible dash, spoken "No data".
  const none = (
    <>
      <span aria-hidden>{t("none")}</span>
      <span className="sr-only">{t("noData")}</span>
    </>
  );

  const visible = deferredQuery
    ? companies.filter((c) => c.name.toLowerCase().includes(deferredQuery))
    : companies;

  return (
    <div className="grid gap-4">
      <div className="relative max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          aria-label={t("searchLabel")}
          className="surface pl-8"
        />
      </div>

      <div className="overflow-hidden rounded-xl border surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">
                {t("columns.company")}
              </TableHead>
              <TableHead className="hidden md:table-cell">
                {t("columns.industry")}
              </TableHead>
              <TableHead>{t("columns.bestStage")}</TableHead>
              <TableHead className="hidden lg:table-cell">
                {t("columns.location")}
              </TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                <span aria-hidden>{t("columns.applications")}</span>
                <span className="sr-only">{t("applicationsFull")}</span>
              </TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                {t("columns.contacts")}
              </TableHead>
              <TableHead className="hidden text-right md:table-cell">
                {t("columns.lastActivity")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((company) => (
              <TableRow key={company.id} className="relative">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <CompanyLogo name={company.name} logo={company.logo} />
                    {/* The stretched link makes the whole row clickable, keyboard reaches it once. */}
                    <Link
                      href={`/companies/${company.id}`}
                      className="font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
                    >
                      {company.name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {company.industry ?? none}
                </TableCell>
                <TableCell>
                  {company.bestStage ? (
                    <StatusBadge status={company.bestStage} />
                  ) : (
                    <span className="text-muted-foreground">{none}</span>
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {company.location ?? none}
                </TableCell>
                <TableCell className="hidden text-right font-mono sm:table-cell">
                  {company.applicationsCount}
                </TableCell>
                <TableCell className="hidden text-right font-mono sm:table-cell">
                  {company.contactsCount}
                </TableCell>
                <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                  {company.lastActivity
                    ? format.relativeTime(new Date(company.lastActivity), now)
                    : none}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {visible.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {t("noResults", { query })}
          </p>
        )}
      </div>
      {/* Always mounted, so screen readers hear the count change as you type. */}
      <p role="status" className="sr-only">
        {deferredQuery ? t("results", { count: visible.length }) : ""}
      </p>
    </div>
  );
}
