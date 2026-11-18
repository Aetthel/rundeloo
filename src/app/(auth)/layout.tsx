import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main className="flex flex-1 flex-col items-center bg-muted px-4 py-16 sm:py-24">
      <Link
        href="/"
        className="mb-10 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {/* Two files: the mark uses different greys per theme, which a single SVG can't switch. */}
        <Image
          src="/brand/logo-on-light.svg"
          alt="Rundeloo"
          width={157}
          height={24}
          priority
          className="dark:hidden"
        />
        <Image
          src="/brand/logo-on-dark.svg"
          alt="Rundeloo"
          width={157}
          height={24}
          priority
          className="hidden dark:block"
        />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
