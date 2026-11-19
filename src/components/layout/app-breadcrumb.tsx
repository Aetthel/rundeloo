"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { breadcrumbFor } from "@/lib/navigation";

/** Section › Details. Behind Suspense because usePathname needs it with Cache Components. */
export function AppBreadcrumb() {
  return (
    <Suspense fallback={null}>
      <BreadcrumbWithPath />
    </Suspense>
  );
}

function BreadcrumbWithPath() {
  const t = useTranslations("nav");
  const crumb = breadcrumbFor(usePathname());
  if (!crumb) return null;

  const label = t(`items.${crumb.key}`);

  return (
    <Breadcrumb aria-label={t("breadcrumb")}>
      <BreadcrumbList>
        <BreadcrumbItem>
          {crumb.detail ? (
            <BreadcrumbLink asChild>
              <Link href={crumb.href}>{label}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{label}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {crumb.detail && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("detail")}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
