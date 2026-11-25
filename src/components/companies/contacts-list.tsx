"use client";

import {
  BellPlus,
  Lock,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { type ReactNode, useRef, useState } from "react";

import { ContactFormSheet } from "@/components/companies/contact-form";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { LinkedinIcon } from "@/components/shared/linkedin-icon";
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

/**
 * Contacts tab (screen 14): a grid of cards so the space is used, each with
 * avatar, role, email, phone, LinkedIn, notes, actions and the Pro reminder teaser.
 */
export function ContactsList({
  companyId,
  contacts,
}: {
  companyId: string;
  contacts: ContactRow[];
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {contacts.map((contact) => (
        <ContactItem key={contact.id} companyId={companyId} contact={contact} />
      ))}
    </ul>
  );
}

/** One line of contact info: icon, then a link or a muted "missing" text. */
function InfoLine({
  icon,
  href,
  label,
  external,
  missing,
  children,
}: {
  icon: ReactNode;
  href: string | null;
  label?: string;
  external?: boolean;
  missing: string;
  children?: ReactNode;
}) {
  return (
    <li className="flex min-w-0 items-center gap-2.5">
      <span className="text-muted-foreground">{icon}</span>
      {href ? (
        <a
          href={href}
          aria-label={label}
          className="truncate underline-offset-4 hover:underline"
          {...(external && { target: "_blank", rel: "noopener noreferrer" })}
        >
          {children}
        </a>
      ) : (
        <span className="text-muted-foreground">{missing}</span>
      )}
    </li>
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
  // Focus returns here after the edit sheet or delete dialog closes.
  const moreRef = useRef<HTMLButtonElement>(null);
  const name = contact.full_name;

  return (
    <li className="flex flex-col rounded-xl border surface">
      <div className="flex items-start gap-3 p-4 pb-3">
        <Avatar className="size-10">
          <AvatarFallback className="text-sm">
            {initialsOf(name)}
          </AvatarFallback>
        </Avatar>
        <div className="grid min-w-0 flex-1">
          <span className="truncate font-medium">{name}</span>
          <span className="truncate text-sm text-muted-foreground">
            {contact.contact_role ? tRole(contact.contact_role) : "—"}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              ref={moreRef}
              variant="ghost"
              size="icon-sm"
              className="size-9 sm:size-7"
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

      <ul className="grid gap-2 px-4 pb-4 text-sm">
        <InfoLine
          icon={<Mail className="size-4" aria-hidden />}
          href={contact.email && `mailto:${contact.email}`}
          label={t("email", { name })}
          missing={t("noEmail")}
        >
          {contact.email}
        </InfoLine>
        <InfoLine
          icon={<Phone className="size-4" aria-hidden />}
          href={contact.phone && `tel:${contact.phone.replace(/\s+/g, "")}`}
          label={t("call", { name })}
          missing={t("noPhone")}
        >
          {contact.phone}
        </InfoLine>
        <InfoLine
          icon={<LinkedinIcon />}
          href={contact.linkedin_url}
          label={t("linkedin", { name })}
          external
          missing={t("noLinkedin")}
        >
          {contact.linkedin_url &&
            contact.linkedin_url.replace(/^https?:\/\/(www\.)?/, "")}
        </InfoLine>
      </ul>

      {contact.notes && (
        <p className="line-clamp-2 px-4 pb-4 text-sm text-muted-foreground">
          {contact.notes}
        </p>
      )}

      <div className="mt-auto flex items-center border-t px-2 py-1.5">
        {/* Pro teaser: visible and focusable, leads to the plan page (the paywall comes later). */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-locked sm:h-7"
          asChild
        >
          <Link href="/settings/billing">
            <BellPlus aria-hidden />
            <span aria-hidden>{t("remind")}</span>
            <Lock className="size-3" aria-hidden />
            <span className="sr-only">{t("remindUnlock")}</span>
          </Link>
        </Button>
      </div>
      {/* Outside the dropdown, which unmounts its content when it closes. */}
      <ContactFormSheet
        companyId={companyId}
        contact={contact}
        open={editOpen}
        onOpenChange={setEditOpen}
        returnFocusTo={moreRef}
      />
      <ConfirmDelete
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        returnFocusTo={moreRef}
        title={t("deleteTitle", { name })}
        description={t("deleteBody")}
        confirmLabel={t("delete")}
        pendingLabel={t("deleting")}
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
