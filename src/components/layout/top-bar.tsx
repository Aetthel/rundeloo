import { getTranslations } from "next-intl/server";

import { AccountMenu } from "@/components/layout/account-menu";
import { AlertsBell } from "@/components/layout/alerts-bell";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getShellUser } from "@/server/account/queries";

/** Breadcrumb on the left, alerts and account on the right. The sidebar toggle is desktop only. */
export async function TopBar() {
  const [t, user] = await Promise.all([getTranslations("nav"), getShellUser()]);

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
        <AccountMenu user={user} />
      </div>
    </header>
  );
}
