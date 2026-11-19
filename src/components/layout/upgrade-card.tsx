import { Sparkles } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

// Fixed light button: the secondary token is steel in dark mode, the card's own color.
const buttonClass = "w-full bg-paper text-graphite hover:bg-fog";

// The one element that stands out from the shell: a dark brand card, a step
// lighter than ink, in both themes (a rare brand moment, so palette colors).
const cardClass =
  "grid gap-2 rounded-lg bg-steel p-3 text-sm text-white group-data-[collapsible=icon]:hidden";

/** Bottom of the sidebar: upsell for free users, plan link for Pro users. Hidden when collapsed. */
export async function UpgradeCard({ isPro }: { isPro: boolean }) {
  const t = await getTranslations("shell");

  if (isPro) {
    return (
      <div className={cardClass}>
        <p className="flex items-center gap-2 font-medium">
          <Sparkles className="size-4" aria-hidden />
          {t("proTitle")}
        </p>
        <Button asChild size="sm" className={buttonClass}>
          <Link href="/settings/billing">{t("proCta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <p className="flex items-center gap-2 font-medium">
        <Sparkles className="size-4" aria-hidden />
        {t("upgradeTitle")}
      </p>
      <p className="text-xs text-fog">{t("upgradeBody")}</p>
      <Button asChild size="sm" className={buttonClass}>
        <Link href="/settings/billing">{t("upgradeCta")}</Link>
      </Button>
    </div>
  );
}
