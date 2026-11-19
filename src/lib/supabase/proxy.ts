import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  needsOnboardingStatus,
  resolveRedirect,
  type AccessState,
} from "@/lib/route-access";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale } from "@/i18n/config";
import { isAuthPreview } from "@/lib/dev-preview";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

type ProxyClient = ReturnType<typeof createServerClient<Database>>;

type ProfileAccess = {
  onboardingCompleted: boolean | null;
  language: string | null;
};

/** Nulls when the profile can't be read, so a database hiccup never locks the user out. */
async function getProfileAccess(
  supabase: ProxyClient,
  userId: string,
): Promise<ProfileAccess> {
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed, language")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Could not read profile access", userId, error);
    return { onboardingCompleted: null, language: null };
  }

  return {
    onboardingCompleted: data?.onboarding_completed ?? null,
    language: data?.language ?? null,
  };
}

/** The locale to write into the cookie, or null when it already matches profiles.language. */
function localeToSync(request: NextRequest, language: string | null) {
  if (!isLocale(language)) return null;
  return request.cookies.get(LOCALE_COOKIE)?.value === language
    ? null
    : language;
}

export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabasePublicEnv();
  let response = NextResponse.next({ request });
  let cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        cacheHeaders = headers;
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // getUser() validates the token with Supabase. Don't replace it with getSession().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Open routes (landing, legal pages) skip the profile query; they keep the cookie as is.
  const profile =
    user && needsOnboardingStatus(pathname)
      ? await getProfileAccess(supabase, user.id)
      : null;

  const state: AccessState = user
    ? {
        signedIn: true,
        onboardingCompleted: profile?.onboardingCompleted ?? null,
      }
    : { signedIn: false };

  // profiles.language wins over the cookie. Mirroring it lets src/i18n/request.ts
  // read only the cookie, without a second profile query per render.
  const syncedLocale = profile ? localeToSync(request, profile.language) : null;
  if (syncedLocale) {
    // Same pattern as setAll: update the request so this render already uses it,
    // then rebuild the response and carry over the session cookies.
    request.cookies.set(LOCALE_COOKIE, syncedLocale);
    const previous = response;
    response = NextResponse.next({ request });
    previous.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    Object.entries(cacheHeaders).forEach(([key, value]) =>
      response.headers.set(key, value),
    );
    response.cookies.set(LOCALE_COOKIE, syncedLocale, {
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }

  // Dev-only UI preview: no redirects at all. Never on in a production build.
  if (isAuthPreview()) return response;

  const destination = resolveRedirect(pathname, state);
  if (!destination) return response;

  const target = request.nextUrl.clone();
  target.pathname = destination;
  target.search = "";
  // Return to the requested page after signing in. signIn() runs it through safeRedirectPath.
  if (!user && destination === "/login") {
    target.searchParams.set("next", pathname + request.nextUrl.search);
  }
  const redirect = NextResponse.redirect(target);
  // Without this, the cookies of a just-refreshed session would be lost.
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  Object.entries(cacheHeaders).forEach(([key, value]) =>
    redirect.headers.set(key, value),
  );
  return redirect;
}
