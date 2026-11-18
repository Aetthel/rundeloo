import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FieldSeparator } from "@/components/ui/field";

// Brand marks drawn with currentColor so they follow the theme. Lucide has no brand icons.
const GOOGLE_PATH =
  "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z";
const LINKEDIN_PATH =
  "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z";

/**
 * Google and LinkedIn sign-in, shown for the design but disabled until the
 * providers are set up. Not a v1 commitment yet: see docs/decisions.md.
 */
export function SocialButtons() {
  const t = useTranslations("auth.social");

  const providers = [
    { name: t("google"), path: GOOGLE_PATH },
    { name: t("linkedin"), path: LINKEDIN_PATH },
  ];

  return (
    <>
      <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
        {t("separator")}
      </FieldSeparator>
      <div className="grid grid-cols-2 gap-3">
        {providers.map(({ name, path }) => (
          <Button
            key={name}
            type="button"
            variant="outline"
            disabled
            title={t("comingSoon")}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d={path} fill="currentColor" />
            </svg>
            {name}
          </Button>
        ))}
      </div>
      <p className="-mt-3 text-center text-xs text-muted-foreground">
        {t("comingSoon")}
      </p>
    </>
  );
}
