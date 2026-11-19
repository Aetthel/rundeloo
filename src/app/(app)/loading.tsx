import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/components/ui/skeleton";

/** Shared loading state for every app route: header line and two content blocks. */
export default async function AppLoading() {
  const t = await getTranslations("states");

  return (
    <div role="status" aria-busy className="grid gap-6">
      <span className="sr-only">{t("loading")}</span>
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
