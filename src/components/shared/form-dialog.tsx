"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, type RefObject, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Centered popup that hosts a create/edit form. Same contract as FormSheet:
 * its own `trigger`, or controlled with `open`/`onOpenChange`, with
 * `returnFocusTo` when the opener unmounts. The form renders only while open,
 * so each opening starts with fresh state.
 */
export function FormDialog({
  trigger,
  open: openProp,
  onOpenChange,
  returnFocusTo,
  title,
  description,
  children,
}: {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  returnFocusTo?: RefObject<HTMLElement | null>;
  title: string;
  description?: string;
  children: (close: () => void) => ReactNode;
}) {
  const t = useTranslations("common");
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className="max-h-[90svh] gap-6 overflow-y-auto p-6 sm:max-w-lg"
        // shadcn's close button has a hardcoded English label; ours is translated.
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          if (returnFocusTo?.current) {
            event.preventDefault();
            returnFocusTo.current.focus();
          }
        }}
      >
        <DialogHeader className="pr-10">
          <DialogTitle className="text-lg">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            className="absolute top-3.5 right-3.5"
            aria-label={t("close")}
          >
            <XIcon aria-hidden className="size-5" />
          </Button>
        </DialogClose>
        {open && children(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  );
}
