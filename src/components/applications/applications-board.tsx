"use client";

import {
  type Announcements,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardCode,
  type KeyboardCoordinateGetter,
  KeyboardSensor,
  PointerSensor,
  rectIntersection,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CalendarClock, ExternalLink, Search } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { CompanyLogo } from "@/components/companies/company-logo";
import { isLinkedinUrl, LinkedinIcon } from "@/components/shared/linkedin-icon";
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

const COLUMN_CAP = 5;
const DIMMED: readonly ApplicationStatus[] = ["on_hold", "rejected"];
const WORK_MODES: readonly WorkMode[] = ["remote", "hybrid", "onsite"];
const DAY = 86_400_000;
/** Deadlines this close are highlighted. */
const URGENT_DAYS = 3;

// Drop-down menus open below the trigger and scroll past ~8 options.
const MENU = { position: "popper", className: "max-h-72" } as const;

type AppliedRange = "any" | "last7" | "last30" | "older";

// Full class names so Tailwind can see them.
const DOT_CLASS: Record<ApplicationStatus, string> = {
  saved: "bg-status-saved",
  applied: "bg-status-applied",
  interview: "bg-status-interview",
  offer: "bg-status-offer",
  on_hold: "bg-status-on-hold",
  rejected: "bg-status-rejected",
};

const newestFirst = (a: ApplicationCard, b: ApplicationCard) =>
  (b.statusChangedAt ?? "").localeCompare(a.statusChangedAt ?? "");

/**
 * Applications board (screen 08): filters on top, six columns in funnel
 * order, 5 cards per column and "Show N more". `now` comes from the server so
 * relative dates render the same on both sides. Cards drag between columns
 * (mouse, touch or keyboard) to change their status: the move shows at once
 * and rolls back if the server refuses it.
 */
export function ApplicationsBoard({
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

  const [query, setQuery] = useState("");
  const [companyId, setCompanyId] = useState("all");
  const [mode, setMode] = useState<WorkMode | "all">("all");
  const [applied, setApplied] = useState<AppliedRange>("any");
  const [expanded, setExpanded] = useState<Set<ApplicationStatus>>(new Set());
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  // Local copy so a drop shows at once; a fresh list from the server replaces it.
  const [items, setItems] = useState(cards);
  const [sourceCards, setSourceCards] = useState(cards);
  if (cards !== sourceCards) {
    setSourceCards(cards);
    setItems(cards);
  }
  const [activeId, setActiveId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // Stable id: dnd-kit numbers its aria ids otherwise, which breaks hydration.
  const dndId = useId();
  const active = items.find((card) => card.id === activeId) ?? null;

  const sensors = useSensors(
    // A short move starts a drag, so a plain click still opens the card.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: jumpBetweenColumns }),
  );

  const roleOf = (id: unknown) =>
    items.find((card) => card.id === id)?.roleTitle ?? "";
  const stageOf = (id: unknown) =>
    PIPELINE_FUNNEL.includes(id as ApplicationStatus)
      ? tStatus(id as ApplicationStatus)
      : "";
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      t("board.drag.picked", { role: roleOf(active.id) }),
    onDragOver: ({ active, over }) =>
      t("board.drag.over", {
        role: roleOf(active.id),
        stage: stageOf(over?.id),
      }),
    onDragEnd: ({ active, over }) =>
      over
        ? t("board.drag.dropped", {
            role: roleOf(active.id),
            stage: stageOf(over.id),
          })
        : t("board.drag.cancelled", { role: roleOf(active.id) }),
    onDragCancel: ({ active }) =>
      t("board.drag.cancelled", { role: roleOf(active.id) }),
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    setMoveError(null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    const card = items.find((item) => item.id === active.id);
    const status = over?.id as ApplicationStatus | undefined;
    if (!card || !status || status === card.status) return;

    const previous = items;
    // Newest change first, so the moved card lands on top of its column.
    setItems(
      items
        .map((item) =>
          item.id === card.id
            ? { ...item, status, statusChangedAt: nowIso }
            : item,
        )
        .sort(newestFirst),
    );
    startTransition(async () => {
      const result = await moveApplication(card.id, status);
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

  const filtered = items.filter((card) => {
    if (
      deferredQuery &&
      !card.roleTitle.toLowerCase().includes(deferredQuery) &&
      !card.company.name.toLowerCase().includes(deferredQuery)
    ) {
      return false;
    }
    if (companyId !== "all" && card.company.id !== companyId) return false;
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
    mode !== "all" ||
    applied !== "any";

  const clearFilters = () => {
    setQuery("");
    setCompanyId("all");
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
        <p
          className="ml-auto font-mono text-sm text-muted-foreground"
          aria-live="polite"
        >
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

      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
        accessibility={{
          announcements,
          screenReaderInstructions: { draggable: t("board.drag.instructions") },
        }}
      >
        <div
          role="region"
          aria-label={t("board.label")}
          // Six columns fit from xl up; below that the board scrolls sideways.
          className="grid auto-cols-[minmax(15rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2 xl:auto-cols-auto xl:grid-flow-row xl:grid-cols-6 xl:overflow-visible"
        >
          {PIPELINE_FUNNEL.map((status) => {
            const column = filtered.filter((card) => card.status === status);
            const open = expanded.has(status);
            return (
              <Column
                key={status}
                status={status}
                label={tStatus(status)}
                cards={open ? column : column.slice(0, COLUMN_CAP)}
                total={column.length}
                open={open}
                now={now}
                modeLabel={(value) => (value ? tMode(value) : null)}
                onToggle={() =>
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    if (open) next.delete(status);
                    else next.add(status);
                    return next;
                  })
                }
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {active && (
            <div className="relative grid rotate-2 cursor-grabbing gap-2 rounded-lg border surface p-3 shadow-lg">
              <CardBody
                card={active}
                now={now}
                modeLabel={active.workMode ? tMode(active.workMode) : null}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

/** Left and right arrows move a picked-up card one column over. */
const jumpBetweenColumns: KeyboardCoordinateGetter = (
  event,
  { context: { active, over, droppableRects, collisionRect } },
) => {
  const step =
    event.code === KeyboardCode.Right
      ? 1
      : event.code === KeyboardCode.Left
        ? -1
        : 0;
  if (!step || !collisionRect) return undefined;
  event.preventDefault();

  const current = (over?.id ?? active?.data.current?.status) as
    ApplicationStatus | undefined;
  const index = current ? PIPELINE_FUNNEL.indexOf(current) : -1;
  const next = PIPELINE_FUNNEL[index + step];
  const target = next ? droppableRects.get(next) : undefined;
  if (!target) return undefined;
  return {
    x: target.left + (target.width - collisionRect.width) / 2,
    y: target.top + 36,
  };
};

function Column({
  status,
  label,
  cards,
  total,
  open,
  now,
  modeLabel,
  onToggle,
}: {
  status: ApplicationStatus;
  label: string;
  cards: ApplicationCard[];
  total: number;
  open: boolean;
  now: Date;
  modeLabel: (mode: WorkMode | null) => string | null;
  onToggle: () => void;
}) {
  const t = useTranslations("applications.board");
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const hidden = total - COLUMN_CAP;

  return (
    <section
      ref={setNodeRef}
      aria-label={t("column", { stage: label, count: total })}
      className={cn(
        // Stretches to the row height, so the whole column takes a drop.
        "-m-1 grid min-w-0 content-start gap-2 rounded-xl p-1 transition-colors",
        DIMMED.includes(status) && !isOver && "opacity-70",
        isOver && "bg-foreground/5 ring-1 ring-foreground/15",
      )}
    >
      <h2 className="flex h-7 items-center gap-2 px-1 text-sm font-medium">
        <span
          className={cn("size-2 rounded-full", DOT_CLASS[status])}
          aria-hidden
        />
        <span className="truncate">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{total}</span>
      </h2>

      {total === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ul className="grid gap-2">
          {cards.map((card) => (
            <BoardCard
              key={card.id}
              card={card}
              now={now}
              modeLabel={modeLabel(card.workMode)}
            />
          ))}
        </ul>
      )}

      {hidden > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start text-muted-foreground"
          aria-expanded={open}
          onClick={onToggle}
        >
          {open ? t("showLess") : t("showMore", { count: hidden })}
        </Button>
      )}
    </section>
  );
}

type CardProps = {
  card: ApplicationCard;
  now: Date;
  modeLabel: string | null;
};

function BoardCard(props: CardProps) {
  const t = useTranslations("applications.board");
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: props.card.id,
    data: { status: props.card.status },
    attributes: { role: "listitem", roleDescription: t("drag.role") },
  });

  // The click that ends a drag must not open the application.
  const dragged = useRef(false);
  useEffect(() => {
    if (isDragging) {
      dragged.current = true;
      return;
    }
    const timer = setTimeout(() => {
      dragged.current = false;
    });
    return () => clearTimeout(timer);
  }, [isDragging]);

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      // Only the card itself picks up on Space or Enter: its links keep opening.
      onKeyDown={(event) => {
        if (event.target === event.currentTarget) listeners?.onKeyDown(event);
      }}
      onClickCapture={(event) => {
        if (dragged.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      className={cn(
        "relative isolate grid cursor-grab touch-manipulation gap-2 rounded-lg border surface p-3 transition-colors outline-none hover:border-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/50",
        isDragging && "opacity-40",
      )}
    >
      <CardBody {...props} />
    </li>
  );
}

function CardBody({ card, now, modeLabel }: CardProps) {
  const t = useTranslations("applications.board");
  const format = useFormatter();

  // Deadline tag only while the application is still open.
  const deadline =
    card.deadline && (card.status === "saved" || card.status === "applied")
      ? new Date(`${card.deadline}T23:59:59`)
      : null;
  const daysLeft = deadline
    ? Math.ceil((deadline.getTime() - now.getTime()) / DAY)
    : null;

  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <CompanyLogo
          name={card.company.name}
          logo={card.company.logo}
          size="xs"
        />
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {card.company.name}
        </span>
        {card.jobUrl && (
          // Above the stretched link, so it opens the posting, not the application.
          <a
            href={card.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              isLinkedinUrl(card.jobUrl)
                ? t("jobLinkedin", { role: card.roleTitle })
                : t("job", { role: card.roleTitle })
            }
            className="relative z-10 -m-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            {isLinkedinUrl(card.jobUrl) ? (
              <LinkedinIcon className="size-3.5" />
            ) : (
              <ExternalLink className="size-3.5" aria-hidden />
            )}
          </a>
        )}
      </div>

      {/* Stretched link: the whole card opens the application. */}
      <Link
        href={`/applications/${card.id}`}
        draggable={false}
        // One line per field: the full title shows on hover.
        title={card.roleTitle}
        className="truncate text-sm leading-snug font-medium after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
      >
        {card.roleTitle}
      </Link>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">{modeLabel ?? "—"}</span>
        {card.statusChangedAt && (
          <span className="shrink-0">
            {format.relativeTime(new Date(card.statusChangedAt), {
              now,
              style: "short",
            })}
          </span>
        )}
      </div>

      {deadline && daysLeft !== null && daysLeft >= 0 && (
        <p
          className={cn(
            "flex min-w-0 items-center gap-1.5 text-xs whitespace-nowrap",
            daysLeft <= URGENT_DAYS
              ? "text-destructive"
              : "text-muted-foreground",
          )}
        >
          <CalendarClock className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {t("closes", {
              time: format.relativeTime(deadline, {
                now,
                unit: "day",
                style: "short",
              }),
            })}
          </span>
        </p>
      )}
    </>
  );
}
