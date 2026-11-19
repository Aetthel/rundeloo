import type { ReactNode } from "react";

/** Muted full-height backdrop; each screen decides its own width and logo. */
export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main className="flex min-h-svh flex-1 flex-col items-center justify-center bg-muted p-6">
      {children}
    </main>
  );
}
