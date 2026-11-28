"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useActionState, useRef, useState } from "react";

import { DOT_CLASS, MENU } from "@/components/applications/shared";
import { CompanyLogo } from "@/components/companies/company-logo";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { FieldShell, FormField } from "@/components/shared/form-field";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormMessage } from "@/components/shared/form-message";
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
import { ROLE_TITLE_MAX } from "@/lib/applications";
import { PIPELINE_FUNNEL, type WorkMode } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ApplicationInput } from "@/lib/validations/application";
import {
  deleteApplication,
  type SaveApplicationState,
  updateApplication,
} from "@/server/applications/actions";
import type { ApplicationCard } from "@/server/applications/queries";

const WORK_MODES: readonly WorkMode[] = ["remote", "hybrid", "onsite"];
const IDLE: SaveApplicationState = { status: "idle" };

export type CompanyOption = ApplicationCard["company"];

/**
 * Pencil and trash buttons at the end of a table row. The pencil opens a
 * popup with every field the table shows; the trash asks before deleting.
 */
export function ApplicationRowActions({
  card,
  companies,
  onSaved,
  onDeleted,
}: {
  card: ApplicationCard;
  companies: CompanyOption[];
  onSaved: (id: string, saved: ApplicationInput) => void;
  onDeleted: (id: string) => void;
}) {
  const t = useTranslations("applications");
  const errorText = useErrorText("applications.errors");
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Focus goes back to the trash button if the user cancels.
  const deleteRef = useRef<HTMLButtonElement>(null);

  return (
    // Above the stretched link, so the buttons don't open the application.
    <div className="relative z-10 flex items-center justify-end gap-0.5">
      <FormDialog
        title={t("form.editTitle")}
        trigger={
          <IconButton label={t("form.edit", { role: card.roleTitle })}>
            <Pencil aria-hidden />
          </IconButton>
        }
      >
        {(close) => (
          <ApplicationForm
            card={card}
            companies={companies}
            onCancel={close}
            onSaved={(saved) => {
              onSaved(card.id, saved);
              close();
            }}
          />
        )}
      </FormDialog>

      {/* Destructive but never immediate: it only opens the confirmation popup. */}
      <IconButton
        ref={deleteRef}
        label={t("delete.button", { role: card.roleTitle })}
        className="hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 aria-hidden />
      </IconButton>
      <ConfirmDelete
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        returnFocusTo={deleteRef}
        title={t("delete.title", {
          role: card.roleTitle,
          company: card.company.name,
        })}
        description={t("delete.body")}
        confirmLabel={t("delete.confirm")}
        pendingLabel={t("delete.deleting")}
        cancelLabel={t("delete.cancel")}
        onConfirm={async () => {
          const result = await deleteApplication(card.id);
          if (result.status === "error") return errorText(result.error);
          onDeleted(card.id);
        }}
      />
    </div>
  );
}

function IconButton({
  label,
  className,
  children,
  ...props
}: {
  label: string;
  children: ReactNode;
} & React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      className={cn(
        "text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

function ApplicationForm({
  card,
  companies,
  onCancel,
  onSaved,
}: {
  card: ApplicationCard;
  companies: CompanyOption[];
  onCancel: () => void;
  onSaved: (saved: ApplicationInput) => void;
}) {
  const t = useTranslations("applications.form");
  const tStatus = useTranslations("enums.applicationStatus");
  const tMode = useTranslations("enums.workMode");
  const errorText = useErrorText("applications.errors");
  const [state, formAction, pending] = useActionState(
    async (prev: SaveApplicationState, formData: FormData) => {
      const result = await updateApplication(card.id, prev, formData);
      if (result.status === "success") onSaved(result.saved);
      return result;
    },
    IDLE,
  );

  const error = state.status === "error" ? state : undefined;
  // After a failed submit, show what was typed; otherwise the saved values.
  const value = (name: string, saved: string | null) =>
    error?.values?.[name] ?? saved ?? "";
  const fieldError = (name: string) => errorText(error?.fieldErrors?.[name]);

  return (
    <form
      action={formAction}
      className="grid gap-4"
      autoComplete="off"
      noValidate
    >
      <FormMessage message={errorText(error?.error)} />
      <FormField
        name="roleTitle"
        label={t("role")}
        hint={t("roleHint", { max: ROLE_TITLE_MAX })}
        placeholder={t("rolePlaceholder")}
        required
        maxLength={80}
        defaultValue={value("roleTitle", card.roleTitle)}
        error={fieldError("roleTitle")}
      />
      <FieldShell
        name="companyId"
        label={t("company")}
        error={fieldError("companyId")}
      >
        {(control) => (
          <Select
            name="companyId"
            defaultValue={value("companyId", card.company.id)}
          >
            <SelectTrigger
              id={control.id}
              aria-invalid={control["aria-invalid"]}
              aria-describedby={control["aria-describedby"]}
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent {...MENU}>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  <CompanyLogo
                    name={company.name}
                    logo={company.logo}
                    size="xs"
                  />
                  <span className="truncate">{company.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FieldShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell name="status" label={t("status")}>
          {(control) => (
            <Select name="status" defaultValue={value("status", card.status)}>
              <SelectTrigger id={control.id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent {...MENU}>
                {PIPELINE_FUNNEL.map((status) => (
                  <SelectItem key={status} value={status}>
                    <span
                      className={cn("size-2 rounded-full", DOT_CLASS[status])}
                      aria-hidden
                    />
                    {tStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FieldShell>
        <FieldShell name="workMode" label={t("mode")}>
          {(control) => (
            <Select
              name="workMode"
              defaultValue={value("workMode", card.workMode) || "none"}
            >
              <SelectTrigger id={control.id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent {...MENU}>
                <SelectItem value="none">{t("noMode")}</SelectItem>
                {WORK_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {tMode(mode)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FieldShell>
        <FormField
          name="appliedAt"
          type="date"
          label={t("applied")}
          defaultValue={value(
            "appliedAt",
            card.appliedAt?.slice(0, 10) ?? null,
          )}
          error={fieldError("appliedAt")}
        />
        <FormField
          name="deadline"
          type="date"
          label={t("deadline")}
          defaultValue={value("deadline", card.deadline)}
          error={fieldError("deadline")}
        />
      </div>
      <FormField
        name="jobUrl"
        label={t("jobUrl")}
        placeholder={t("jobUrlPlaceholder")}
        inputMode="url"
        maxLength={500}
        defaultValue={value("jobUrl", card.jobUrl)}
        error={fieldError("jobUrl")}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <div>
          <SubmitButton
            pending={pending}
            label={t("save")}
            pendingLabel={t("saving")}
          />
        </div>
      </div>
    </form>
  );
}
