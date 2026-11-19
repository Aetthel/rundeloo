"use client";

import { type ReactNode, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Side panel that hosts a create/edit form (the pattern M1 will reuse).
 * Opens from its own `trigger`, or is controlled with `open`/`onOpenChange`
 * when the opener lives somewhere that unmounts, like a dropdown item.
 * The form renders only while open, so each opening starts with fresh state.
 */
export function FormSheet({
  trigger,
  open: openProp,
  onOpenChange,
  title,
  description,
  children,
}: {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="px-4 pb-6">
          {open && children(() => setOpen(false))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
