import type { ComponentProps, ReactNode } from "react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ShellProps = {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  labelAction?: ReactNode;
};

type ControlProps = {
  id: string;
  name: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

/** Label, hint and error around any control, wired with aria-describedby for screen readers. */
export function FieldShell({
  name,
  label,
  hint,
  error,
  labelAction,
  children,
}: ShellProps & { children: (control: ControlProps) => ReactNode }) {
  const id = `field-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <Field data-invalid={error ? true : undefined}>
      <div className="flex items-center">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {labelAction && <div className="ml-auto">{labelAction}</div>}
      </div>
      {children({
        id,
        name,
        "aria-invalid": error ? true : undefined,
        "aria-describedby":
          [errorId, hintId].filter(Boolean).join(" ") || undefined,
      })}
      {error ? (
        <FieldError id={errorId}>{error}</FieldError>
      ) : (
        hint && <FieldDescription id={hintId}>{hint}</FieldDescription>
      )}
    </Field>
  );
}

/** Labelled input. */
export function FormField({
  name,
  label,
  hint,
  error,
  labelAction,
  ...inputProps
}: ShellProps & Omit<ComponentProps<"input">, "name">) {
  return (
    <FieldShell {...{ name, label, hint, error, labelAction }}>
      {(control) => <Input {...control} {...inputProps} />}
    </FieldShell>
  );
}

/** Labelled multi-line text. */
export function FormTextarea({
  name,
  label,
  hint,
  error,
  ...textareaProps
}: ShellProps & Omit<ComponentProps<"textarea">, "name">) {
  return (
    <FieldShell {...{ name, label, hint, error }}>
      {(control) => <Textarea {...control} {...textareaProps} />}
    </FieldShell>
  );
}
