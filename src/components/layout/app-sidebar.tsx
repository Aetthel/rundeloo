import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { NavGroups } from "@/components/layout/nav-groups";
import { UpgradeCard } from "@/components/layout/upgrade-card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { getShellUser } from "@/server/account/queries";

/**
 * shadcn Sidebar, collapsible to icons on desktop and a sheet on mobile.
 * The user's plan is read behind Suspense so navigation stays instant: the menu
 * shows at once (locks assumed, as for free users) and the plan arrives after.
 */
export async function AppSidebar() {
  const t = await getTranslations("nav");

  return (
    <Sidebar collapsible="icon" aria-label={t("mainNav")}>
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex h-10 items-center rounded-lg px-2 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {/* Full logo when open, the mark alone when collapsed to icons. */}
          <span className="group-data-[collapsible=icon]:hidden">
            <Image
              src="/brand/logo-on-light.svg"
              alt="Rundeloo"
              width={118}
              height={18}
              className="dark:hidden"
              priority
            />
            <Image
              src="/brand/logo-on-dark.svg"
              alt="Rundeloo"
              width={118}
              height={18}
              className="hidden dark:block"
              priority
            />
          </span>
          <span className="hidden group-data-[collapsible=icon]:block">
            <Image
              src="/brand/logo-mark-on-light.svg"
              alt="Rundeloo"
              width={20}
              height={14}
              className="dark:hidden"
            />
            <Image
              src="/brand/logo-mark-on-dark.svg"
              alt="Rundeloo"
              width={20}
              height={14}
              className="hidden dark:block"
            />
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={<NavGroups isPro={false} />}>
          <UserNavGroups />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        <Suspense fallback={null}>
          <UserUpgradeCard />
        </Suspense>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

async function UserNavGroups() {
  const { isPro } = await getShellUser();
  return <NavGroups isPro={isPro} />;
}

async function UserUpgradeCard() {
  const { isPro } = await getShellUser();
  return <UpgradeCard isPro={isPro} />;
}
