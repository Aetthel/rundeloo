"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import {
  daysUntil,
  MENU,
  newestFirst,
  URGENT_DAYS,
} from "@/components/applications/shared";
import {
  ApplicationRowActions,
  type CompanyOption,
} from "@/components/applications/application-row-actions";
import { CompanyLogo } from "@/components/companies/company-logo";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { nextStepOf } from "@/lib/applications";
import { PIPELINE_PRIORITY } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ApplicationInput } from "@/lib/validations/application";
import type { ApplicationCard } from "@/server/applications/queries";

const PAGE_SIZE = 12;

type SortKey =
  "pipeline" | "recent" | "company" | "role" | "mode" | "applied" | "deadline";
type Direction = "asc" | "desc";

const SORT_KEYS: readonly SortKey[] = [
  "pipeline",
  "recent",
  "company",
  "role",
  "mode",
  "applied",
  "deadline",
];
// First pick of a key: dates newest first, deadlines soonest first, text A→Z.
const DEFAULT_DIRECTION: Record<SortKey, Direction> = {
  pipeline: "asc",
  recent: "desc",
  company: "asc",
  role: "asc",
  mode: "asc",
  applied: "desc",
  deadline: "asc",
};
const MODE_ORDER = ["remote", "hybrid", "onsite"];

const VALUE: Record<
  SortKey,
  (card: ApplicationCard) => string | number | null
> = {
  pipeline: (card) => PIPELINE_PRIORITY.indexOf(card.status),
  recent: (card) => card.statusChangedAt,
  company: (card) => card.company.name,
  role: (card) => card.roleTitle,
  mode: (card) => (card.workMode ? MODE_ORDER.indexOf(card.workMode) : null),
  applied: (card) => card.appliedAt,
  deadline: (card) => card.deadline,
};

/** Sorts by one key; empty values go last either way, ties newest change first. */
function sortCards(cards: ApplicationCard[], key: SortKey, dir: Direction) {
  const sign = dir === "asc" ? 1 : -1;
  return [...cards].sort((a, b) => {
    const x = VALUE[key](a);
    const y = VALUE[key](b);
    if (x === null || y === null) {
      if (x !== y) return x === null ? 1 : -1;
    } else {
      const result =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y));
      if (result) return result * sign;
    }
    return newestFirst(a, b);
  });
}

/**
 * Table view (screen 09): sortable headers and a Sort control that agree,
 * 12 rows per page, a derived "Next step", and pencil and trash buttons to
 * edit or delete each application.
 */
export function ApplicationsTable({
  cards,
  now,
  companies,
  onSaved,
  onDeleted,
}: {
  cards: ApplicationCard[];
  now: Date;
  companies: CompanyOption[];
  onSaved: (id: string, saved: ApplicationInput) => void;
  onDeleted: (id: string) => void;
}) {
  const t = useTranslations("applications.table");
  const tMode = useTranslations("enums.workMode");
  const format = useFormatter();

  const [sort, setSort] = useState<{ key: SortKey; dir: Direction }>({
    key: "pipeline",
    dir: "asc",
  });
  const [page, setPage] = useState(0);

  const sorted = sortCards(cards, sort.key, sort.dir);
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  // Filters can shrink the list under the current page.
  const current = Math.min(page, pages - 1);
  const rows = sorted.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const sortBy = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: DEFAULT_DIRECTION[key] },
    );
    setPage(0);
  };

  const date = (iso: string) =>
    format.dateTime(new Date(iso.length === 10 ? `${iso}T12:00:00` : iso), {
      day: "numeric",
      month: "short",
    });
  const none = (
    <>
      <span aria-hidden>—</span>
      <span className="sr-only">{t("noData")}</span>
    </>
  );

  const header = (key: SortKey, label: string, className?: string) => {
    const active = sort.key === key;
    const Icon = !active
      ? ChevronsUpDown
      : sort.dir === "asc"
        ? ArrowUp
        : ArrowDown;
    return (
      <TableHead
        className={className}
        aria-sort={
          active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
        }
      >
        <button
          type="button"
          onClick={() => sortBy(key)}
          className={cn(
            "-mx-1 inline-flex items-center gap-1 rounded-md px-1 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            active && "text-foreground",
          )}
        >
          {label}
          <Icon
            className={cn("size-3.5", !active && "opacity-50")}
            aria-hidden
          />
        </button>
      </TableHead>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border surface">
      <div className="flex items-center gap-3 border-b px-4 py-2.5">
        <span className="text-sm text-muted-foreground">{t("sort.label")}</span>
        <Select
          value={sort.key}
          onValueChange={(value) => {
            const key = value as SortKey;
            setSort({ key, dir: DEFAULT_DIRECTION[key] });
            setPage(0);
          }}
        >
          <SelectTrigger
            size="sm"
            className="w-48"
            aria-label={t("sort.label")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent {...MENU}>
            {SORT_KEYS.map((key) => (
              <SelectItem key={key} value={key}>
                {t(`sort.${key}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            setSort((prev) => ({
              ...prev,
              dir: prev.dir === "asc" ? "desc" : "asc",
            }))
          }
          aria-label={
            sort.dir === "asc" ? t("sort.ascending") : t("sort.descending")
          }
          title={
            sort.dir === "asc" ? t("sort.ascending") : t("sort.descending")
          }
        >
          {sort.dir === "asc" ? (
            <ArrowUp aria-hidden />
          ) : (
            <ArrowDown aria-hidden />
          )}
        </Button>
        {/* Range and pager share the sort bar: one toolbar, no half-empty footer. */}
        {cards.length > 0 && (
          <div className="ml-auto flex items-center gap-3">
            <p className="font-mono text-xs text-muted-foreground">
              {t("range", {
                from: current * PAGE_SIZE + 1,
                to: current * PAGE_SIZE + rows.length,
                total: sorted.length,
              })}
            </p>
            {pages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setPage(current - 1)}
                  disabled={current === 0}
                  aria-label={t("previous")}
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <span className="font-mono text-xs text-muted-foreground">
                  <span aria-hidden>
                    {current + 1}/{pages}
                  </span>
                  <span className="sr-only">
                    {t("page", { page: current + 1, total: pages })}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setPage(current + 1)}
                  disabled={current === pages - 1}
                  aria-label={t("next")}
                >
                  <ChevronRight aria-hidden />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Table aria-label={t("label")}>
        <TableHeader>
          <TableRow>
            {header("company", t("columns.company"), "pl-4")}
            {header("role", t("columns.role"))}
            {header("pipeline", t("columns.status"))}
            {header("mode", t("columns.mode"), "hidden lg:table-cell")}
            {header("applied", t("columns.applied"), "hidden md:table-cell")}
            {header("deadline", t("columns.deadline"), "hidden md:table-cell")}
            <TableHead className="hidden lg:table-cell">
              {t("columns.nextStep")}
            </TableHead>
            <TableHead className="w-20 pr-4">
              <span className="sr-only">{t("columns.actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((card) => {
            const open = card.status === "saved" || card.status === "applied";
            const daysLeft = daysUntil(card.deadline, now);
            const urgent =
              open &&
              daysLeft !== null &&
              daysLeft >= 0 &&
              daysLeft <= URGENT_DAYS;
            const step = nextStepOf(card, now);

            return (
              <TableRow key={card.id} className="relative isolate">
                <TableCell className="pl-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <CompanyLogo
                      name={card.company.name}
                      logo={card.company.logo}
                      size="xs"
                    />
                    <span className="truncate text-muted-foreground">
                      {card.company.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="max-w-56">
                  {/* Stretched link: the whole row opens the application. */}
                  <Link
                    href={`/applications/${card.id}`}
                    title={card.roleTitle}
                    className="block truncate font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
                  >
                    {card.roleTitle}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={card.status} />
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {card.workMode ? tMode(card.workMode) : none}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {card.appliedAt ? date(card.appliedAt) : none}
                </TableCell>
                <TableCell
                  className={cn(
                    "hidden md:table-cell",
                    urgent ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {card.deadline ? date(card.deadline) : none}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {step ? (
                    t(`nextStep.${step.key}`, {
                      date: "date" in step ? date(step.date) : "",
                    })
                  ) : (
                    <span className="text-muted-foreground">{none}</span>
                  )}
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <ApplicationRowActions
                    card={card}
                    companies={companies}
                    onSaved={onSaved}
                    onDeleted={onDeleted}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
