"use client";

import { Kanban, Table2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ApplicationsViewMode = "board" | "table";

/** The applications view lives in `?view=`; board is the default. */
export function useApplicationsView(): ApplicationsViewMode {
  return useSearchParams().get("view") === "table" ? "table" : "board";
}

/**
 * Board/Table toggle in the page header. It rewrites `?view=` in place
 * (no navigation), so filters and local moves survive the switch.
 */
export function ViewToggle() {
  const t = useTranslations("applications.view");
  const view = useApplicationsView();

  const switchTo = (next: ApplicationsViewMode) => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    window.history.replaceState(null, "", url);
  };

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex rounded-lg border surface p-0.5"
    >
      {(["board", "table"] as const).map((value) => {
        const Icon = value === "board" ? Kanban : Table2;
        return (
          <Button
            key={value}
            variant="ghost"
            size="sm"
            aria-pressed={view === value}
            onClick={() => switchTo(value)}
            className={cn(
              "h-7 gap-1.5 px-2.5 text-muted-foreground",
              view === value &&
                "bg-foreground/10 text-foreground hover:bg-foreground/10",
            )}
          >
            <Icon aria-hidden />
            {t(value)}
          </Button>
        );
      })}
    </div>
  );
}
