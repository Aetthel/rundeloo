import Image from "next/image";
import Link from "next/link";

/** Theme-aware logo linking home. Two files: the mark's greys differ per theme. */
export function AuthLogo() {
  return (
    <Link
      href="/"
      className="mx-auto rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
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
  );
}
