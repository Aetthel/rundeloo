"use client";

import {
  BellPlus,
  Lock,
  Mail,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ContactFormSheet } from "@/components/companies/contact-form";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { useErrorText } from "@/components/shared/use-error-text";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialsOf } from "@/lib/companies";
import type { ContactRow } from "@/server/companies/queries";
import { deleteContact } from "@/server/contacts/actions";

const LINKEDIN_PATH =
  "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z";

/** Contacts tab (screen 14): avatar, role, email, LinkedIn, actions and the Pro reminder teaser. */
export function ContactsList({
  companyId,
  contacts,
}: {
  companyId: string;
  contacts: ContactRow[];
}) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-background">
      {contacts.map((contact) => (
        <ContactItem key={contact.id} companyId={companyId} contact={contact} />
      ))}
    </ul>
  );
}

function ContactItem({
  companyId,
  contact,
}: {
  companyId: string;
  contact: ContactRow;
}) {
  const t = useTranslations("companies.contacts");
  const tRole = useTranslations("enums.contactRole");
  const errorText = useErrorText("companies.errors");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const name = contact.full_name;

  return (
    <li className="flex flex-wrap items-center gap-3 p-4">
      <Avatar className="size-9">
        <AvatarFallback className="text-xs">{initialsOf(name)}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1">
        <span className="truncate font-medium">{name}</span>
        <span className="truncate text-sm text-muted-foreground">
          {[contact.contact_role && tRole(contact.contact_role), contact.email]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {contact.email && (
          <Button variant="ghost" size="icon-sm" asChild>
            <a
              href={`mailto:${contact.email}`}
              aria-label={t("email", { name })}
            >
              <Mail aria-hidden />
            </a>
          </Button>
        )}
        {contact.linkedin_url && (
          <Button variant="ghost" size="icon-sm" asChild>
            <a
              href={contact.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("linkedin", { name })}
            >
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
                <path d={LINKEDIN_PATH} fill="currentColor" />
              </svg>
            </a>
          </Button>
        )}
        {/* Pro teaser: visible but locked; the reminders panel arrives with Pro features. */}
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="text-locked"
          title={t("remindLocked")}
        >
          <BellPlus aria-hidden />
          {t("remind")}
          <Lock className="size-3" aria-hidden />
          <span className="sr-only">{t("remindLocked")}</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("actions", { name })}
            >
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil aria-hidden />
              {t("edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setConfirmOpen(true)}
            >
              <Trash2 aria-hidden />
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Outside the dropdown, which unmounts its content when it closes. */}
      <ContactFormSheet
        companyId={companyId}
        contact={contact}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ConfirmDelete
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("deleteTitle", { name })}
        description={t("deleteBody")}
        confirmLabel={t("delete")}
        pendingLabel={t("delete")}
        cancelLabel={t("form.cancel")}
        onConfirm={async () => {
          const result = await deleteContact({
            contactId: contact.id,
            companyId,
          });
          return result.status === "error"
            ? errorText(result.error)
            : undefined;
        }}
      />
    </li>
  );
}
