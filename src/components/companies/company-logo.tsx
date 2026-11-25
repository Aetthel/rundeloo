import Image from "next/image";

import { initialsOf } from "@/lib/companies";
import { cn } from "@/lib/utils";

const SIZE = {
  xs: { box: "size-5 rounded-md text-[0.5rem]", icon: 16 },
  sm: { box: "size-8 text-xs", icon: 24 },
  lg: { box: "size-14 text-lg", icon: 44 },
} as const;

/**
 * Company mark. The favicon (a data URI fetched by the server, see
 * src/server/companies/favicon.ts) stands on its own, with no frame; without
 * one, the initials sit in a framed square. The outer box keeps the same
 * footprint either way, so rows and headers stay aligned.
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
        "flex shrink-0 items-center justify-center",
        box,
        !logo && "rounded-lg border surface font-medium text-muted-foreground",
      )}
    >
      {logo ? (
        // Already inlined as a data URI: nothing for the image optimizer to fetch.
        <Image
          src={logo}
          alt=""
          width={icon}
          height={icon}
          unoptimized
          className="rounded-sm"
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
