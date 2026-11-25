import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ApplicationsBoard } from "@/components/applications/applications-board";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { listApplications } from "@/server/applications/queries";

/** Applications board (screen 08). The table view (09) comes next. */
export default async function ApplicationsPage() {
  const [t, tNav] = await Promise.all([
    getTranslations("applications"),
    getTranslations("nav"),
  ]);

  return (
    <>
      <PageHeader
        title={tNav("items.applications")}
        description={t("description")}
      />
      <Suspense fallback={<BoardSkeleton />}>
        <Board />
      </Suspense>
    </>
  );
}

async function Board() {
  const cards = await listApplications();
  return <ApplicationsBoard cards={cards} now={new Date().toISOString()} />;
}

function BoardSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-9 w-full max-w-3xl rounded-lg" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-72 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
