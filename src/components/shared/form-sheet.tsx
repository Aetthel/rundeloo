"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, type RefObject, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Side panel that hosts a create/edit form (the pattern M1 will reuse).
 * Opens from its own `trigger`, or is controlled with `open`/`onOpenChange`
 * when the opener lives somewhere that unmounts, like a dropdown item; then
 * `returnFocusTo` gives focus back to a stable element on close.
 * The form renders only while open, so each opening starts with fresh state.
 */
export function FormSheet({
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
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        className="w-full overflow-y-auto sm:max-w-md"
        // shadcn's close button has a hardcoded English label; ours is translated.
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          if (returnFocusTo?.current) {
            event.preventDefault();
            returnFocusTo.current.focus();
          }
        }}
      >
        <SheetHeader className="pr-12">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <SheetClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3"
            aria-label={t("close")}
          >
            <XIcon aria-hidden />
          </Button>
        </SheetClose>
        <div className="px-4 pb-6">
          {open && children(() => setOpen(false))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
