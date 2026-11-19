import type { ReactNode } from "react";

import { AuthLogo } from "@/components/auth/auth-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Narrow card for register and password screens: logo, titled card, optional link below. */
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
    <div className="flex w-full max-w-sm flex-col gap-6">
      <AuthLogo />
      <Card className="py-6 [--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            <h1>{title}</h1>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {footer && <p className="text-center text-sm">{footer}</p>}
    </div>
  );
}
