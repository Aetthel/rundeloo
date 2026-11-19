import Image from "next/image";

import { initialsOf } from "@/lib/companies";
import { cn } from "@/lib/utils";

const SIZE = {
  sm: { box: "size-8 text-xs", icon: 18 },
  lg: { box: "size-14 text-lg", icon: 32 },
} as const;

/**
 * Company mark: the site's favicon when we have it (a data URI fetched by the
 * server, see src/server/companies/favicon.ts), otherwise its initials.
 * Decorative, since the name is always next to it.
 */
export function CompanyLogo({
  name,
  logo,
  size = "sm",
}: {
  name: string;
  logo?: string | null;
  size?: keyof typeof SIZE;
}) {
  const { box, icon } = SIZE[size];

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border bg-background font-medium text-muted-foreground",
        box,
      )}
    >
      {logo ? (
        // Already inlined as a data URI: nothing for the image optimizer to fetch.
        <Image src={logo} alt="" width={icon} height={icon} unoptimized />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
