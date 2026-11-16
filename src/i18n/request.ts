import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { LOCALE_COOKIE } from "@/i18n/config";
import { resolveLocale } from "@/i18n/resolve-locale";

// Without locale routing, next-intl calls this once per request. profiles.language
// is not read here: src/proxy.ts mirrors it into the cookie, saving a query.
export default getRequestConfig(async () => {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);

  const locale = resolveLocale({
    cookie: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerList.get("accept-language"),
  });

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
