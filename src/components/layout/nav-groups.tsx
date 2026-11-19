"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { isActive, NAV_GROUPS } from "@/lib/navigation";

/**
 * Sidebar groups from src/lib/navigation.ts. usePathname needs Suspense with
 * Cache Components, so the fallback is the same menu with nothing highlighted.
 */
export function NavGroups({ isPro }: { isPro: boolean }) {
  return (
    <Suspense fallback={<NavGroupsView pathname={null} isPro={isPro} />}>
      <NavGroupsWithPath isPro={isPro} />
    </Suspense>
  );
}

function NavGroupsWithPath({ isPro }: { isPro: boolean }) {
  return <NavGroupsView pathname={usePathname()} isPro={isPro} />;
}

function NavGroupsView({
  pathname,
  isPro,
}: {
  pathname: string | null;
  isPro: boolean;
}) {
  const t = useTranslations("nav");
  // Close the mobile sheet after picking a destination.
  const { setOpenMobile } = useSidebar();

  return NAV_GROUPS.map((group) => (
    <SidebarGroup key={group.key}>
      <SidebarGroupLabel className="text-2xs tracking-wide uppercase">
        {t(`groups.${group.key}`)}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => {
            const active = pathname ? isActive(pathname, item.href) : false;
            const locked = item.pro && !isPro;
            return (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={t(`items.${item.key}`)}
                >
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpenMobile(false)}
                  >
                    <item.icon aria-hidden />
                    <span>{t(`items.${item.key}`)}</span>
                  </Link>
                </SidebarMenuButton>
                {locked && (
                  <SidebarMenuBadge className="gap-1 text-locked">
                    <Lock className="size-3" aria-hidden />
                    <span>{t("pro")}</span>
                    <span className="sr-only">{t("proLocked")}</span>
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}
