const DEV_SITE_URL = "http://localhost:3000";

/**
 * Base URL for links in auth emails. Never derived from the Host header, which a
 * client controls. Fails closed in production when NEXT_PUBLIC_SITE_URL is missing.
 */
export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (url) return url.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return DEV_SITE_URL;
  throw new Error("Missing environment variable NEXT_PUBLIC_SITE_URL");
}

/** Absolute /auth/callback URL that lands on `next` after the session exchange. */
export function authCallbackUrl(next: string) {
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}
