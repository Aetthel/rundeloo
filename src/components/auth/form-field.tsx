import type { ComponentProps, ReactNode } from "react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** Labelled input with hint and error wired to aria-describedby for screen readers. */
export function FormField({
  name,
  label,
  hint,
  error,
  labelAction,
  ...inputProps
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  labelAction?: ReactNode;
} & Omit<ComponentProps<"input">, "name">) {
  const id = `field-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <Field data-invalid={error ? true : undefined}>
      <div className="flex items-center">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {labelAction && <div className="ml-auto">{labelAction}</div>}
      </div>
      <Input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [errorId, hintId].filter(Boolean).join(" ") || undefined
        }
        {...inputProps}
      />
      {error ? (
        <FieldError id={errorId}>{error}</FieldError>
      ) : (
        hint && <FieldDescription id={hintId}>{hint}</FieldDescription>
      )}
    </Field>
  );
}
