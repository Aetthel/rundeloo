"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

/** Shared error state for app routes. The raw error is logged, never shown. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("states");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={TriangleAlert}
      title={t("errorTitle")}
      description={t("errorBody")}
      action={
        <Button variant="outline" onClick={reset}>
          {t("retry")}
        </Button>
      }
    />
  );
}
