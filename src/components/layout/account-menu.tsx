"use client";

import { Languages, LogOut, SunMoon } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useTransition } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES } from "@/i18n/config";
import { ACCOUNT_ITEMS } from "@/lib/navigation";
import { themeSchema } from "@/lib/validations/account";
import { saveThemePreference } from "@/server/account/actions";
import type { ShellUser } from "@/server/account/queries";
import { signOut } from "@/server/auth/actions";
import { setLocale } from "@/server/i18n/actions";

const THEMES = themeSchema.options;

function initials(user: ShellUser) {
  const source = user.name?.trim() || user.email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Top-right account menu: links, theme, language and sign-out. */
export function AccountMenu({ user }: { user: ShellUser }) {
  const t = useTranslations();
  const locale = useLocale();
  const { theme = "system", setTheme } = useTheme();
  const [pending, startTransition] = useTransition();

  const pickTheme = (value: string) => {
    const parsed = themeSchema.safeParse(value);
    if (!parsed.success) return;
    setTheme(parsed.data);
    // Remember it in profiles.theme; the switch above already happened.
    startTransition(async () => {
      await saveThemePreference(parsed.data);
    });
  };

  const pickLocale = (value: string) => {
    // setLocale writes the cookie and profiles.language; the route re-renders in the new language.
    startTransition(async () => {
      await setLocale(value);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={t("shell.account")}
        >
          <Avatar className="size-8">
            <AvatarFallback className="text-xs font-medium">
              {initials(user)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="grid font-normal">
          {user.name && (
            <span className="truncate font-medium text-foreground">
              {user.name}
            </span>
          )}
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {ACCOUNT_ITEMS.map((item) => (
            <DropdownMenuItem key={item.key} asChild>
              <Link href={item.href}>
                <item.icon aria-hidden />
                {t(`nav.items.${item.key}`)}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoon aria-hidden />
            {t("shell.theme")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={pickTheme}>
              {THEMES.map((value) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  {t(`shell.themes.${value}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={pending}>
            <Languages aria-hidden />
            {t("shell.language")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={locale} onValueChange={pickLocale}>
              {LOCALES.map((value) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  {t(`common.languages.${value}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        {/* A real form so sign-out works as a POST to the Server Action. */}
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut aria-hidden />
              {t("shell.signOut")}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
