import type { ApplicationStatus } from "@/lib/constants";
import type { ApplicationCard } from "@/server/applications/queries";

// Drop-down menus open below the trigger and scroll past ~8 options.
export const MENU = { position: "popper", className: "max-h-72" } as const;

// Full class names so Tailwind can see them.
export const DOT_CLASS: Record<ApplicationStatus, string> = {
  saved: "bg-status-saved",
  applied: "bg-status-applied",
  interview: "bg-status-interview",
  offer: "bg-status-offer",
  on_hold: "bg-status-on-hold",
  rejected: "bg-status-rejected",
};

export const DAY = 86_400_000;
/** Deadlines this close are highlighted. */
export const URGENT_DAYS = 3;

export const newestFirst = (a: ApplicationCard, b: ApplicationCard) =>
  (b.statusChangedAt ?? "").localeCompare(a.statusChangedAt ?? "");

/** Days left until a deadline (end of that day), or null without one. */
export function daysUntil(deadline: string | null, now: Date) {
  if (!deadline) return null;
  return Math.ceil(
    (new Date(`${deadline}T23:59:59`).getTime() - now.getTime()) / DAY,
  );
}
