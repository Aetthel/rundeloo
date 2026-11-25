import type { ReactNode } from "react";

/**
 * Top row of every app screen. The title is already shown in the top bar, so it
 * stays only as the screen-reader h1; the description leads, actions on the right.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <>
      <h1 className="sr-only">{title}</h1>
      {(description || actions) && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          {description && (
            <p className="text-xl font-medium tracking-tight text-foreground">
              {description}
            </p>
          )}
          {actions && (
            <div className="ml-auto flex items-center gap-2">{actions}</div>
          )}
        </div>
      )}
    </>
  );
}
