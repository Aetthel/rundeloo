"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { isActive, MOBILE_BAR_KEYS, navItem } from "@/lib/navigation";

/** Bottom bar below md. "More" opens the sidebar as a sheet with every destination. */
export function MobileBar() {
  return (
    <Suspense fallback={<MobileBarView pathname={null} />}>
      <MobileBarWithPath />
    </Suspense>
  );
}

function MobileBarWithPath() {
  return <MobileBarView pathname={usePathname()} />;
}

const itemClass =
  "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-2xs text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

function MobileBarView({ pathname }: { pathname: string | null }) {
  const t = useTranslations("nav");
  const { setOpenMobile } = useSidebar();

  return (
    <nav
      aria-label={t("mobileNav")}
      className="fixed inset-x-0 bottom-0 z-20 flex border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {MOBILE_BAR_KEYS.map((key) => {
        const item = navItem(key);
        const active = pathname ? isActive(pathname, item.href) : false;
        return (
          <Link
            key={key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(itemClass, active && "font-medium text-foreground")}
          >
            <item.icon className="size-5" aria-hidden />
            {t(`items.${key}`)}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => setOpenMobile(true)}
        className={itemClass}
      >
        <Menu className="size-5" aria-hidden />
        {t("more")}
      </button>
    </nav>
  );
}
