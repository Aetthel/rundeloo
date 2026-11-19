"use client";

import { useTranslations } from "next-intl";

/** Namespaces that hold the error keys returned by Server Actions; each has "unexpected". */
type ErrorNamespace = "auth.errors" | "companies.errors";

/** Turns an error key from a Server Action into text. Unknown keys fall back to "unexpected". */
export function useErrorText(namespace: ErrorNamespace = "auth.errors") {
  const t = useTranslations(namespace);
  type Key = Parameters<typeof t>[0];

  return (key: string | undefined) => {
    if (!key) return undefined;
    return t.has(key as Key) ? t(key as Key) : t("unexpected" as Key);
  };
}
