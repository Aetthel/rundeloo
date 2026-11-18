import Image from "next/image";

/**
 * Right-hand panel of the login card (shadcn login-04). Placeholder until the
 * brand PNG arrives: white logo on ink, a rare brand moment where the palette is allowed.
 */
export function BrandPanel() {
  return (
    <div className="relative hidden items-center justify-center bg-ink p-10 md:flex">
      <Image
        src="/brand/logo-white.svg"
        alt="Rundeloo"
        width={197}
        height={30}
        priority
      />
    </div>
  );
}
