import { useTranslations } from "next-intl";

import type { ApplicationStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Full class names so Tailwind can see them; tokens from globals.css (4.5:1 per theme).
const STATUS_CLASS: Record<ApplicationStatus, string> = {
  saved: "text-status-saved",
  applied: "text-status-applied",
  interview: "text-status-interview",
  offer: "text-status-offer",
  on_hold: "text-status-on-hold",
  rejected: "text-status-rejected",
};

const DOT_CLASS: Record<ApplicationStatus, string> = {
  saved: "bg-status-saved",
  applied: "bg-status-applied",
  interview: "bg-status-interview",
  offer: "bg-status-offer",
  on_hold: "bg-status-on-hold",
  rejected: "bg-status-rejected",
};

/** Application status: colored dot + translated label, no container, never color alone. */
export function StatusBadge({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  const t = useTranslations("enums.applicationStatus");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-xs font-medium whitespace-nowrap",
        STATUS_CLASS[status],
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", DOT_CLASS[status])}
        aria-hidden
      />
      {t(status)}
    </span>
  );
}
