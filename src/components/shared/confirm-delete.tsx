"use client";

import { type ReactNode, type RefObject, useState, useTransition } from "react";

import { FormMessage } from "@/components/shared/form-message";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Destructive confirmation. Controlled (`open`) so it can be opened from a
 * dropdown item, with `returnFocusTo` for the element that should get focus
 * back. `onConfirm` returns an error message, or nothing on success.
 */
export function ConfirmDelete({
  open,
  onOpenChange,
  returnFocusTo,
  title,
  description,
  confirmLabel,
  pendingLabel,
  cancelLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusTo?: RefObject<HTMLElement | null>;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  cancelLabel: string;
  onConfirm: () => Promise<string | undefined>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const confirm = () => {
    if (pending) return;
    startTransition(async () => {
      const message = await onConfirm();
      if (message) setError(message);
      else onOpenChange(false);
    });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setError(undefined);
        onOpenChange(next);
      }}
    >
      <AlertDialogContent
        onCloseAutoFocus={(event) => {
          if (returnFocusTo?.current) {
            event.preventDefault();
            returnFocusTo.current.focus();
          }
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <FormMessage message={error} />
        <AlertDialogFooter>
          <AlertDialogCancel aria-disabled={pending || undefined}>
            {cancelLabel}
          </AlertDialogCancel>
          {/* aria-disabled instead of disabled keeps focus on the button while it works.
              A plain button: AlertDialogAction would close before the action finishes. */}
          <Button
            variant="destructive"
            onClick={confirm}
            aria-disabled={pending || undefined}
            aria-busy={pending || undefined}
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
