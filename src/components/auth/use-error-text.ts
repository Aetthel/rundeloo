"use client";

import { useTranslations } from "next-intl";

/** Turns an error key from a Server Action into text. Unknown keys fall back to "unexpected". */
export function useErrorText() {
  const t = useTranslations("auth.errors");
  type Key = Parameters<typeof t>[0];

  return (key: string | undefined) => {
    if (!key) return undefined;
    return t.has(key as Key) ? t(key as Key) : t("unexpected");
  };
}
