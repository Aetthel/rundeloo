"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRef, useState } from "react";

import {
  CompanyFormSheet,
  type CompanyFormValues,
} from "@/components/companies/company-form";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { useErrorText } from "@/components/shared/use-error-text";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCompany } from "@/server/companies/actions";

/** Edit and delete buttons in the company header. */
export function CompanyActions({
  company,
  applicationsCount,
  contactsCount,
}: {
  company: CompanyFormValues;
  applicationsCount: number;
  contactsCount: number;
}) {
  const t = useTranslations("companies");
  const errorText = useErrorText("companies.errors");
  const format = useFormatter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);

  // "2 applications and 1 contact", only naming what exists.
  const items = [
    applicationsCount > 0 &&
      t("delete.applications", { count: applicationsCount }),
    contactsCount > 0 && t("delete.contacts", { count: contactsCount }),
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="flex items-center gap-2">
      <CompanyFormSheet
        company={company}
        trigger={
          <Button variant="outline" size="sm" className="h-9 sm:h-7">
            <Pencil aria-hidden />
            {t("detail.edit")}
          </Button>
        }
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={moreRef}
            variant="outline"
            size="icon-sm"
            className="size-9 sm:size-7"
            aria-label={t("detail.more")}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2 aria-hidden />
            {t("detail.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDelete
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        returnFocusTo={moreRef}
        title={t("delete.title", { name: company.name })}
        description={
          items.length
            ? t("delete.body", { items: format.list(items) })
            : t("delete.bodyEmpty")
        }
        confirmLabel={t("delete.confirm")}
        pendingLabel={t("delete.deleting")}
        cancelLabel={t("delete.cancel")}
        onConfirm={async () => {
          // On success the action redirects to /companies.
          const result = await deleteCompany(company.id);
          return result.status === "error"
            ? errorText(result.error)
            : undefined;
        }}
      />
    </div>
  );
}
