"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useActionState } from "react";

import { FormField, FormTextarea } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { FormDialog } from "@/components/shared/form-dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { useErrorText } from "@/components/shared/use-error-text";
import { Button } from "@/components/ui/button";
import { IDLE, type FormState } from "@/lib/form-state";
import { createCompany, updateCompany } from "@/server/companies/actions";

export type CompanyFormValues = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  location: string | null;
  notes: string | null;
};

/** "Add company" or "Edit" button that opens the company form in a centered popup. */
export function CompanyFormDialog({
  company,
  trigger,
}: {
  company?: CompanyFormValues;
  trigger: ReactNode;
}) {
  const t = useTranslations("companies.form");

  return (
    <FormDialog
      trigger={trigger}
      title={company ? t("editTitle") : t("createTitle")}
      description={t("description")}
    >
      {(close) => <CompanyForm company={company} onSaved={close} />}
    </FormDialog>
  );
}

function CompanyForm({
  company,
  onSaved,
}: {
  company?: CompanyFormValues;
  onSaved: () => void;
}) {
  const t = useTranslations("companies.form");
  const errorText = useErrorText("companies.errors");
  const [state, formAction, pending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      // Create redirects to the new company; edit stays and closes the panel.
      const result = company
        ? await updateCompany(company.id, prev, formData)
        : await createCompany(prev, formData);
      if (result.status === "success") onSaved();
      return result;
    },
    IDLE,
  );

  const error = state.status === "error" ? state : undefined;
  // After a failed submit, show what was typed; otherwise the saved values.
  const value = (name: keyof Omit<CompanyFormValues, "id">) =>
    error?.values?.[name] ?? company?.[name] ?? "";
  const fieldError = (name: string) => errorText(error?.fieldErrors?.[name]);

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <FormMessage message={errorText(error?.error)} />
      <FormField
        name="name"
        label={t("name")}
        placeholder={t("namePlaceholder")}
        required
        maxLength={120}
        defaultValue={value("name")}
        error={fieldError("name")}
      />
      <FormField
        name="website"
        label={t("website")}
        placeholder={t("websitePlaceholder")}
        inputMode="url"
        autoComplete="url"
        defaultValue={value("website")}
        error={fieldError("website")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          name="industry"
          label={t("industry")}
          placeholder={t("industryPlaceholder")}
          maxLength={80}
          defaultValue={value("industry")}
          error={fieldError("industry")}
        />
        <FormField
          name="location"
          label={t("location")}
          placeholder={t("locationPlaceholder")}
          maxLength={120}
          defaultValue={value("location")}
          error={fieldError("location")}
        />
      </div>
      <FormTextarea
        name="notes"
        label={t("notes")}
        placeholder={t("notesPlaceholder")}
        rows={5}
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
            label={company ? t("save") : t("create")}
            pendingLabel={t("saving")}
          />
        </div>
      </div>
    </form>
  );
}
