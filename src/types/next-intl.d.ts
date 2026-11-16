import type { Locale } from "@/i18n/config";
import type messages from "@/messages/en.json";

// English is the source of truth: a missing or misspelled key fails type-checking.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
