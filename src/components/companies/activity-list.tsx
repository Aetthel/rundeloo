"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const PAGE_SIZE = 4;

export type ActivityEvent = { id: string; text: string; when: string };

/**
 * Recent activity of a company, newest first, 4 per page. Short pages are
 * padded with empty rows so the container keeps its height between pages.
 */
export function ActivityList({
  title,
  events,
}: {
  title: string;
  events: ActivityEvent[];
}) {
  const t = useTranslations("companies.detail");
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const visible = events.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const padding = pages > 1 ? PAGE_SIZE - visible.length : 0;

  return (
    <div className="border-t p-4">
      <div className="mb-3 flex h-7 items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{title}</h2>
        {pages > 1 && (
          <div className="flex items-center gap-1">
            <span
              className="font-mono text-xs text-muted-foreground"
              aria-live="polite"
            >
              <span aria-hidden>
                {page + 1}/{pages}
              </span>
              <span className="sr-only">
                {t("activityPage", { page: page + 1, total: pages })}
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              aria-label={t("activityPrev")}
            >
              <ChevronLeft aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === pages - 1}
              aria-label={t("activityNext")}
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>
        )}
      </div>
      <ol className="grid auto-rows-[1.25rem] gap-3">
        {visible.map((event) => (
          <li key={event.id} className="flex items-center gap-3 text-sm">
            <span
              className="size-1.5 shrink-0 rounded-full bg-muted-foreground/60"
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">{event.text}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {event.when}
            </span>
          </li>
        ))}
        {Array.from({ length: padding }, (_, i) => (
          <li key={`pad-${i}`} aria-hidden />
        ))}
      </ol>
    </div>
  );
}
