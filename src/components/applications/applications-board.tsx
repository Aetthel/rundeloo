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
import { CalendarClock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

import {
  DOT_CLASS,
  daysUntil,
  URGENT_DAYS,
} from "@/components/applications/shared";
import { CompanyLogo } from "@/components/companies/company-logo";
import { isLinkedinUrl, LinkedinIcon } from "@/components/shared/linkedin-icon";
import { Button } from "@/components/ui/button";
import {
  type ApplicationStatus,
  PIPELINE_FUNNEL,
  type WorkMode,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ApplicationCard } from "@/server/applications/queries";

const COLUMN_CAP = 5;
const DIMMED: readonly ApplicationStatus[] = ["on_hold", "rejected"];

/**
 * Board view (screen 08): six columns in funnel order, 5 cards per column and
 * "Show N more". Cards drag between columns (mouse, touch or keyboard) to
 * change their status through `onMove`.
 */
export function ApplicationsBoard({
  cards,
  now,
  onMove,
}: {
  cards: ApplicationCard[];
  now: Date;
  onMove: (id: string, status: ApplicationStatus) => void;
}) {
  const t = useTranslations("applications");
  const tStatus = useTranslations("enums.applicationStatus");
  const tMode = useTranslations("enums.workMode");

  const [expanded, setExpanded] = useState<Set<ApplicationStatus>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  // Stable id: dnd-kit numbers its aria ids otherwise, which breaks hydration.
  const dndId = useId();
  const active = cards.find((card) => card.id === activeId) ?? null;

  const sensors = useSensors(
    // A short move starts a drag, so a plain click still opens the card.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: jumpBetweenColumns }),
  );

  const roleOf = (id: unknown) =>
    cards.find((card) => card.id === id)?.roleTitle ?? "";
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

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (over) onMove(String(active.id), over.id as ApplicationStatus);
  };

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={({ active }: DragStartEvent) =>
        setActiveId(String(active.id))
      }
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
          const column = cards.filter((card) => card.status === status);
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
  const open = card.status === "saved" || card.status === "applied";
  const daysLeft = open ? daysUntil(card.deadline, now) : null;
  const deadline =
    daysLeft !== null ? new Date(`${card.deadline}T23:59:59`) : null;

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
