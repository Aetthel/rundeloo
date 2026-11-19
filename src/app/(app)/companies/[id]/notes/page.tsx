import { NotebookPen } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";

/** Notes tab of a company: linked notes arrive with the notes editor (task 11). */
export default async function CompanyNotesPage() {
  const t = await getTranslations("companies.detail");

  return (
    <EmptyState
      icon={NotebookPen}
      title={t("notesTabTitle")}
      description={t("notesTabBody")}
    />
  );
}
