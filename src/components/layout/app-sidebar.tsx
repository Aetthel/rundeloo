import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

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

/** shadcn Sidebar, collapsible to icons on desktop and a sheet on mobile. */
export async function AppSidebar() {
  const [t, user] = await Promise.all([getTranslations("nav"), getShellUser()]);

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
        <NavGroups isPro={user.isPro} />
      </SidebarContent>
      <SidebarFooter>
        <UpgradeCard isPro={user.isPro} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
