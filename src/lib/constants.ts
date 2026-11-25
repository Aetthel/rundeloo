import type { Database } from "@/types/database";

export type ApplicationStatus =
  Database["public"]["Enums"]["application_status"];
export type ContactRole = Database["public"]["Enums"]["contact_role"];
export type WorkMode = Database["public"]["Enums"]["work_mode"];

export const MAX_QUESTIONS_PER_SIMULATION = 5;

/**
 * Board columns, left to right: the funnel. Never sort by the enum itself
 * (`ORDER BY status`): its order is not the product order.
 */
export const PIPELINE_FUNNEL: readonly ApplicationStatus[] = [
  "saved",
  "applied",
  "interview",
  "offer",
  "on_hold",
  "rejected",
];

/** "Pipeline stage" priority for tables and "best stage": most advanced first. */
export const PIPELINE_PRIORITY: readonly ApplicationStatus[] = [
  "offer",
  "interview",
  "applied",
  "saved",
  "on_hold",
  "rejected",
];

export const CONTACT_ROLES = [
  "recruiter",
  "referral",
  "interviewer",
  "other",
] as const satisfies readonly ContactRole[];
