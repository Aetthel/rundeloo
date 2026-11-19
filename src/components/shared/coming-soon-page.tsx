import { Hammer } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import type { NavKey } from "@/lib/navigation";

/** Placeholder for screens not built yet, so every route renders inside the shell. */
export async function ComingSoonPage({ section }: { section: NavKey }) {
  const [tNav, tStates] = await Promise.all([
    getTranslations("nav"),
    getTranslations("states"),
  ]);

  return (
    <>
      <PageHeader title={tNav(`items.${section}`)} />
      <EmptyState
        icon={Hammer}
        title={tStates("comingSoonTitle")}
        description={tStates("comingSoonBody")}
      />
    </>
  );
}
