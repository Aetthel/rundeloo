"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { cn } from "@/lib/utils";

type TabKey = "applications" | "contacts" | "notes";

/**
 * Detail tabs are nested routes (shareable URLs, back button works).
 * usePathname sits behind Suspense; the fallback highlights nothing.
 */
export function CompanyTabs(props: {
  companyId: string;
  counts: Record<TabKey, number>;
}) {
  return (
    <Suspense fallback={<TabsView {...props} pathname={null} />}>
      <TabsWithPath {...props} />
    </Suspense>
  );
}

function TabsWithPath(props: {
  companyId: string;
  counts: Record<TabKey, number>;
}) {
  return <TabsView {...props} pathname={usePathname()} />;
}

function TabsView({
  companyId,
  counts,
  pathname,
}: {
  companyId: string;
  counts: Record<TabKey, number>;
  pathname: string | null;
}) {
  const t = useTranslations("companies.detail");
  const base = `/companies/${companyId}`;
  const tabs: { key: TabKey; href: string }[] = [
    { key: "applications", href: base },
    { key: "contacts", href: `${base}/contacts` },
    { key: "notes", href: `${base}/notes` },
  ];

  return (
    <nav aria-label={t("tabsLabel")} className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 border-transparent px-3 py-3 text-sm text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:py-2",
              active && "border-foreground font-medium text-foreground",
            )}
          >
            {t(`tabs.${tab.key}`)}
            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
              {counts[tab.key]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
