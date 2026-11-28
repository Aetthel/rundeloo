"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeferredValue, useMemo, useState, useTransition } from "react";

import { ApplicationsBoard } from "@/components/applications/applications-board";
import { ApplicationsTable } from "@/components/applications/applications-table";
import {
  DAY,
  DOT_CLASS,
  MENU,
  newestFirst,
} from "@/components/applications/shared";
import { useApplicationsView } from "@/components/applications/view-toggle";
import { CompanyLogo } from "@/components/companies/company-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ApplicationStatus,
  PIPELINE_FUNNEL,
  type WorkMode,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { moveApplication } from "@/server/applications/actions";
import type { ApplicationCard } from "@/server/applications/queries";

const WORK_MODES: readonly WorkMode[] = ["remote", "hybrid", "onsite"];

type AppliedRange = "any" | "last7" | "last30" | "older";

/**
 * Applications (screens 08 and 09): shared filters and the status moves both
 * views make. The view comes from `?view=`, which the header toggle rewrites
 * in place, so filters survive the switch. `now` comes from the server so
 * relative dates render the same on both sides.
 */
export function ApplicationsView({
  cards,
  now: nowIso,
}: {
  cards: ApplicationCard[];
  now: string;
}) {
  const t = useTranslations("applications");
  const tStatus = useTranslations("enums.applicationStatus");
  const tMode = useTranslations("enums.workMode");
  const now = useMemo(() => new Date(nowIso), [nowIso]);

  const view = useApplicationsView();
  const [query, setQuery] = useState("");
  const [companyId, setCompanyId] = useState("all");
  const [status, setStatus] = useState<ApplicationStatus | "all">("all");
  const [mode, setMode] = useState<WorkMode | "all">("all");
  const [applied, setApplied] = useState<AppliedRange>("any");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  // Local copy so a move shows at once; a fresh list from the server replaces it.
  const [items, setItems] = useState(cards);
  const [sourceCards, setSourceCards] = useState(cards);
  if (cards !== sourceCards) {
    setSourceCards(cards);
    setItems(cards);
  }
  const [moveError, setMoveError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  /** Moves an application to another status; rolls back if the server refuses. */
  const move = (id: string, next: ApplicationStatus) => {
    const card = items.find((item) => item.id === id);
    if (!card || card.status === next) return;
    setMoveError(null);

    const previous = items;
    // Newest change first, so the moved card lands on top of its column.
    setItems(
      items
        .map((item) =>
          item.id === id
            ? { ...item, status: next, statusChangedAt: nowIso }
            : item,
        )
        .sort(newestFirst),
    );
    startTransition(async () => {
      const result = await moveApplication(id, next);
      if (!result.ok) {
        setItems(previous);
        setMoveError(t("board.drag.failed", { role: card.roleTitle }));
      }
    });
  };

  const companies = useMemo(() => {
    const byId = new Map(cards.map((c) => [c.company.id, c.company]));
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [cards]);

  // The status filter belongs to the table: on the board, columns are statuses.
  const statusFilter = view === "table" ? status : "all";
  const filtered = items.filter((card) => {
    if (
      deferredQuery &&
      !card.roleTitle.toLowerCase().includes(deferredQuery) &&
      !card.company.name.toLowerCase().includes(deferredQuery)
    ) {
      return false;
    }
    if (companyId !== "all" && card.company.id !== companyId) return false;
    if (statusFilter !== "all" && card.status !== statusFilter) return false;
    if (mode !== "all" && card.workMode !== mode) return false;
    if (applied !== "any") {
      if (!card.appliedAt) return false;
      const days = (now.getTime() - new Date(card.appliedAt).getTime()) / DAY;
      if (applied === "last7" && days > 7) return false;
      if (applied === "last30" && days > 30) return false;
      if (applied === "older" && days <= 30) return false;
    }
    return true;
  });
  const filtering =
    deferredQuery !== "" ||
    companyId !== "all" ||
    statusFilter !== "all" ||
    mode !== "all" ||
    applied !== "any";

  const clearFilters = () => {
    setQuery("");
    setCompanyId("all");
    setStatus("all");
    setMode("all");
    setApplied("any");
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            aria-label={t("searchLabel")}
            className="surface pl-8"
          />
        </div>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger
            className="w-44 surface"
            aria-label={t("filters.company")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent {...MENU}>
            <SelectItem value="all">{t("filters.allCompanies")}</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                <CompanyLogo
                  name={company.name}
                  logo={company.logo}
                  size="xs"
                />
                <span className="truncate">{company.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {view === "table" && (
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as ApplicationStatus | "all")
            }
          >
            <SelectTrigger
              className="w-40 surface"
              aria-label={t("filters.status")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent {...MENU}>
              <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
              {PIPELINE_FUNNEL.map((value) => (
                <SelectItem key={value} value={value}>
                  <span
                    className={cn("size-2 rounded-full", DOT_CLASS[value])}
                    aria-hidden
                  />
                  {tStatus(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select
          value={mode}
          onValueChange={(value) => setMode(value as WorkMode | "all")}
        >
          <SelectTrigger
            className="w-44 surface"
            aria-label={t("filters.mode")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent {...MENU}>
            <SelectItem value="all">{t("filters.allModes")}</SelectItem>
            {WORK_MODES.map((value) => (
              <SelectItem key={value} value={value}>
                {tMode(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={applied}
          onValueChange={(value) => setApplied(value as AppliedRange)}
        >
          <SelectTrigger
            className="w-44 surface"
            aria-label={t("filters.applied")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent {...MENU}>
            <SelectItem value="any">{t("filters.anyDate")}</SelectItem>
            <SelectItem value="last7">{t("filters.last7")}</SelectItem>
            <SelectItem value="last30">{t("filters.last30")}</SelectItem>
            <SelectItem value="older">{t("filters.older")}</SelectItem>
          </SelectContent>
        </Select>
        {filtering && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {t("filters.clear")}
          </Button>
        )}

        {/* No visible total: screen readers still hear the count change. */}
        <p role="status" className="sr-only">
          {t("total", { count: filtered.length })}
        </p>
      </div>

      {filtering && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("board.noResults")}</p>
      )}
      {moveError && (
        <p role="alert" className="text-sm text-destructive">
          {moveError}
        </p>
      )}

      {view === "board" ? (
        <ApplicationsBoard cards={filtered} now={now} onMove={move} />
      ) : (
        <ApplicationsTable cards={filtered} now={now} onMove={move} />
      )}
    </div>
  );
}
