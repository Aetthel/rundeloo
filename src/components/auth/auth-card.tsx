import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Wireframes 02–04: titled card with the form, and an optional link below it. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <>
      <Card className="py-6 [--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            <h1>{title}</h1>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {footer && <p className="mt-6 text-center text-sm">{footer}</p>}
    </>
  );
}
