// Derived company fields, kept free of I/O so they can be unit tested.

import { type ApplicationStatus, PIPELINE_PRIORITY } from "@/lib/constants";

/** The most advanced status among a company's applications, or null when it has none. */
export function bestStage(
  statuses: readonly ApplicationStatus[],
): ApplicationStatus | null {
  return PIPELINE_PRIORITY.find((stage) => statuses.includes(stage)) ?? null;
}

/** Sort key for "best stage": lower is better; companies without applications go last. */
export function stageRank(stage: ApplicationStatus | null) {
  return stage ? PIPELINE_PRIORITY.indexOf(stage) : PIPELINE_PRIORITY.length;
}

/** Latest of several ISO timestamps (nulls ignored). */
export function latestDate(dates: readonly (string | null | undefined)[]) {
  let latest: string | null = null;
  for (const date of dates) {
    if (date && (!latest || Date.parse(date) > Date.parse(latest)))
      latest = date;
  }
  return latest;
}

/**
 * "acme.com" → "https://acme.com". Only http(s) URLs with a dotted host are
 * accepted: anything else (javascript:, mailto:, bare words) returns null.
 */
export function normalizeWebsite(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

/** Host without "www." for display: "https://www.acme.com/jobs" → "acme.com". */
export function displayHost(website: string) {
  try {
    return new URL(website).hostname.replace(/^www\./, "");
  } catch {
    return website;
  }
}

/** Up to two initials: "Acme Labs" → "AL", "stripe" → "S". */
export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "?";
}
