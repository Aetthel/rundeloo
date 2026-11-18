import Image from "next/image";

/**
 * Right-hand panel of the login card (shadcn login-04): the page's muted
 * background with the theme-aware logo. Placeholder until the brand PNG arrives.
 */
export function BrandPanel() {
  return (
    <div className="relative hidden items-center justify-center bg-muted p-10 md:flex">
      {/* Two files: the mark's greys differ per theme. */}
      <Image
        src="/brand/logo-on-light.svg"
        alt="Rundeloo"
        width={236}
        height={36}
        priority
        className="dark:hidden"
      />
      <Image
        src="/brand/logo-on-dark.svg"
        alt="Rundeloo"
        width={236}
        height={36}
        priority
        className="hidden dark:block"
      />
    </div>
  );
}
