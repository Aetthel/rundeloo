"use client";

import { type ReactNode, useState, useTransition } from "react";

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
 * dropdown item. `onConfirm` returns an error message or nothing on success.
 */
export function ConfirmDelete({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  cancelLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  cancelLabel: string;
  onConfirm: () => Promise<string | undefined>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const confirm = () =>
    startTransition(async () => {
      const message = await onConfirm();
      if (message) setError(message);
      else onOpenChange(false);
    });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setError(undefined);
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <FormMessage message={error} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          {/* A plain button: AlertDialogAction would close before the action finishes. */}
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
