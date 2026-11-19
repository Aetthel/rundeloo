"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, type RefObject, useActionState } from "react";

import {
  FieldShell,
  FormField,
  FormTextarea,
} from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { FormSheet } from "@/components/shared/form-sheet";
import { SubmitButton } from "@/components/shared/submit-button";
import { useErrorText } from "@/components/shared/use-error-text";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_ROLES } from "@/lib/constants";
import { IDLE, type FormState } from "@/lib/form-state";
import { createContact, updateContact } from "@/server/contacts/actions";
import type { ContactRow } from "@/server/companies/queries";

const NO_ROLE = "none";

/** Add or edit a contact of one company, in a side panel. */
export function ContactFormSheet({
  companyId,
  contact,
  trigger,
  open,
  onOpenChange,
  returnFocusTo,
}: {
  companyId: string;
  contact?: ContactRow;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  returnFocusTo?: RefObject<HTMLElement | null>;
}) {
  const t = useTranslations("companies.contacts.form");

  return (
    <FormSheet
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      returnFocusTo={returnFocusTo}
      title={contact ? t("editTitle") : t("createTitle")}
      description={t("description")}
    >
      {(close) => (
        <ContactForm companyId={companyId} contact={contact} onSaved={close} />
      )}
    </FormSheet>
  );
}

function ContactForm({
  companyId,
  contact,
  onSaved,
}: {
  companyId: string;
  contact?: ContactRow;
  onSaved: () => void;
}) {
  const t = useTranslations("companies.contacts.form");
  const tRole = useTranslations("enums.contactRole");
  const errorText = useErrorText("companies.errors");
  const [state, formAction, pending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      // The select's "no role" option travels as "none"; the schema expects "".
      if (formData.get("contactRole") === NO_ROLE)
        formData.set("contactRole", "");
      const result = contact
        ? await updateContact(
            { contactId: contact.id, companyId },
            prev,
            formData,
          )
        : await createContact(companyId, prev, formData);
      if (result.status === "success") onSaved();
      return result;
    },
    IDLE,
  );

  const error = state.status === "error" ? state : undefined;
  const saved = {
    fullName: contact?.full_name,
    contactRole: contact?.contact_role,
    email: contact?.email,
    phone: contact?.phone,
    linkedinUrl: contact?.linkedin_url,
    notes: contact?.notes,
  };
  const value = (name: keyof typeof saved) =>
    error?.values?.[name] ?? saved[name] ?? "";
  const fieldError = (name: string) => errorText(error?.fieldErrors?.[name]);

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <FormMessage message={errorText(error?.error)} />
      <FormField
        name="fullName"
        label={t("fullName")}
        placeholder={t("fullNamePlaceholder")}
        autoComplete="off"
        required
        maxLength={120}
        defaultValue={value("fullName")}
        error={fieldError("fullName")}
      />
      <FieldShell
        name="contactRole"
        label={t("role")}
        error={fieldError("contactRole")}
      >
        {({ id, name, ...aria }) => (
          <Select name={name} defaultValue={value("contactRole") || NO_ROLE}>
            <SelectTrigger id={id} className="w-full" {...aria}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ROLE}>{t("noRole")}</SelectItem>
              {CONTACT_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {tRole(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FieldShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          name="email"
          type="email"
          label={t("email")}
          placeholder={t("emailPlaceholder")}
          autoComplete="off"
          defaultValue={value("email")}
          error={fieldError("email")}
        />
        <FormField
          name="phone"
          type="tel"
          label={t("phone")}
          autoComplete="off"
          maxLength={40}
          defaultValue={value("phone")}
          error={fieldError("phone")}
        />
      </div>
      <FormField
        name="linkedinUrl"
        label={t("linkedin")}
        placeholder={t("linkedinPlaceholder")}
        inputMode="url"
        defaultValue={value("linkedinUrl")}
        error={fieldError("linkedinUrl")}
      />
      <FormTextarea
        name="notes"
        label={t("notes")}
        rows={4}
        maxLength={5000}
        defaultValue={value("notes")}
        error={fieldError("notes")}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSaved}>
          {t("cancel")}
        </Button>
        <div>
          <SubmitButton
            pending={pending}
            label={contact ? t("save") : t("create")}
            pendingLabel={t("saving")}
          />
        </div>
      </div>
    </form>
  );
}
