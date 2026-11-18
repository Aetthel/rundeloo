import type { z } from "zod";

/**
 * Result of a form Server Action used with useActionState. Messages are i18n keys,
 * so the client renders them in the user's language.
 */
export type FormState<Field extends string = string> =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      error?: string;
      fieldErrors?: Partial<Record<Field, string>>;
      // React 19 resets the form after an action: echo safe values back. Never passwords.
      values?: Partial<Record<Field, string>>;
    };

export const IDLE: FormState = { status: "idle" };

/** First error per field, as returned by a failed safeParse. */
export function fieldErrorsOf<Field extends string>(
  error: z.ZodError,
): Partial<Record<Field, string>> {
  const result: Partial<Record<Field, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in result)) {
      result[field as Field] = issue.message;
    }
  }
  return result;
}
