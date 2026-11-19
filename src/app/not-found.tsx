import { SearchX } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("states");

  return (
    <main className="flex min-h-svh flex-col bg-muted p-6">
      <EmptyState
        icon={SearchX}
        title={t("notFoundTitle")}
        description={t("notFoundBody")}
        action={
          <Button asChild>
            <Link href="/dashboard">{t("backHome")}</Link>
          </Button>
        }
      />
    </main>
  );
}
