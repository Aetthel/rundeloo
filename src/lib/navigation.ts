import {
  Briefcase,
  Building2,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  type LucideIcon,
  MessageCircleQuestion,
  NotebookPen,
  Settings,
  Sparkles,
} from "lucide-react";

/**
 * Single source of the app navigation: the sidebar, the breadcrumb and the
 * mobile bottom bar all read from here. `key` is the i18n key under "nav.items".
 */
export type NavKey =
  | "dashboard"
  | "applications"
  | "companies"
  | "calendar"
  | "notes"
  | "questions"
  | "weeklySummary"
  | "settings"
  | "billing";

export type NavItem = {
  key: NavKey;
  href: string;
  icon: LucideIcon;
  /** Pro feature: stays visible for free users with a lock (gating is on the server). */
  pro?: boolean;
};

export const NAV_GROUPS: { key: "workspace" | "prep"; items: NavItem[] }[] = [
  {
    key: "workspace",
    items: [
      { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
      { key: "applications", href: "/applications", icon: Briefcase },
      { key: "companies", href: "/companies", icon: Building2 },
      { key: "calendar", href: "/calendar", icon: CalendarDays },
      { key: "notes", href: "/notes", icon: NotebookPen },
    ],
  },
  {
    key: "prep",
    items: [
      { key: "questions", href: "/questions", icon: MessageCircleQuestion },
      {
        key: "weeklySummary",
        href: "/weekly-summary",
        icon: Sparkles,
        pro: true,
      },
    ],
  },
];

export const ACCOUNT_ITEMS: NavItem[] = [
  { key: "settings", href: "/settings", icon: Settings },
  { key: "billing", href: "/settings/billing", icon: CreditCard },
];

/** Mobile bottom bar; everything else is under "More", which opens the sidebar sheet. */
export const MOBILE_BAR_KEYS: NavKey[] = [
  "dashboard",
  "applications",
  "calendar",
  "notes",
];

const ALL_ITEMS = [...NAV_GROUPS.flatMap((g) => g.items), ...ACCOUNT_ITEMS];

export function navItem(key: NavKey): NavItem {
  const item = ALL_ITEMS.find((i) => i.key === key);
  if (!item) throw new Error(`Unknown nav item ${key}`);
  return item;
}

/** Active when on the item's route or below it. /settings must not light up on /settings/billing. */
export function isActive(pathname: string, href: string) {
  if (href === "/settings") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Breadcrumb trail from the pathname: the deepest matching nav item, then a
 * generic "details" crumb for anything below it (ids are not shown).
 */
export function breadcrumbFor(
  pathname: string,
): { key: NavKey; href: string; detail: boolean } | null {
  const match = ALL_ITEMS.filter(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0];
  if (!match) return null;
  return { key: match.key, href: match.href, detail: pathname !== match.href };
}
