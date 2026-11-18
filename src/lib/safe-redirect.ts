// Any origin works as the base: it only has to be one an attacker can't produce.
const BASE = "http://internal.invalid";

/**
 * Accepts internal paths only, to prevent open redirects. Browsers treat "//evil.com"
 * and "/\evil.com" as another domain, and strip tab, CR and LF before parsing, so
 * "/\t/evil.com" becomes "//evil.com". Control characters are rejected outright, and
 * the value must still resolve to our own origin.
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/dashboard",
) {
  if (!value || !value.startsWith("/")) return fallback;
  if (/[\u0000-\u001F\u007F\\]/.test(value)) return fallback;

  const url = new URL(value, BASE);
  if (url.origin !== BASE || value.startsWith("//")) return fallback;
  return url.pathname + url.search + url.hash;
}
