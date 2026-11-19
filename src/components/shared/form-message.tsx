import { cn } from "@/lib/utils";

/**
 * Form-level message. Errors use role="alert" and confirmations role="status",
 * so screen readers announce them when the action returns.
 */
export function FormMessage({
  title,
  message,
  tone = "error",
}: {
  title?: string;
  message?: string;
  tone?: "error" | "info";
}) {
  if (!message) return null;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "grid gap-1 rounded-lg border px-3 py-2 text-sm",
        tone === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border bg-muted text-foreground",
      )}
    >
      {title && <p className="font-medium">{title}</p>}
      <p>{message}</p>
    </div>
  );
}
