import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AccountMenu } from "@/components/layout/account-menu";
import { AlertsBell } from "@/components/layout/alerts-bell";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getShellUser } from "@/server/account/queries";

/**
 * Breadcrumb on the left, alerts and account on the right. The sidebar toggle is
 * desktop only. The account menu waits for the user behind Suspense.
 */
export async function TopBar() {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-sidebar px-4">
      <SidebarTrigger
        className="-ml-1 hidden md:inline-flex"
        aria-label={t("toggleSidebar")}
      />
      <Separator
        orientation="vertical"
        className="mr-2 hidden md:block data-vertical:h-4 data-vertical:self-center"
      />
      <AppBreadcrumb />
      <div className="ml-auto flex items-center gap-1">
        <AlertsBell />
        <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
          <UserAccountMenu />
        </Suspense>
      </div>
    </header>
  );
}

async function UserAccountMenu() {
  return <AccountMenu user={await getShellUser()} />;
}
