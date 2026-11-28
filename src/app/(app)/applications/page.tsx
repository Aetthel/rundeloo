import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ApplicationsView } from "@/components/applications/applications-view";
import { ViewToggle } from "@/components/applications/view-toggle";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { listApplications } from "@/server/applications/queries";

/** Applications: board (screen 08) or table (09), picked with `?view=`. */
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
        actions={
          // Reads the URL, so it waits for the request like the view does.
          <Suspense fallback={<Skeleton className="h-8 w-40 rounded-lg" />}>
            <ViewToggle />
          </Suspense>
        }
      />
      <Suspense fallback={<ViewSkeleton />}>
        <View />
      </Suspense>
    </>
  );
}

async function View() {
  const cards = await listApplications();
  return <ApplicationsView cards={cards} now={new Date().toISOString()} />;
}

function ViewSkeleton() {
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
