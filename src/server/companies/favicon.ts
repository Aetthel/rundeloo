import "server-only";

import { cacheLife } from "next/cache";

// Raster formats only: SVG could carry scripts if ever rendered outside an <img>.
const ALLOWED_TYPES = new Set([
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/png",
  "image/gif",
  "image/jpeg",
  "image/webp",
]);
const MAX_BYTES = 32_000;
const HOSTNAME = /^(?=.{4,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;

/**
 * A company's favicon as a data URI, or null (the logo falls back to initials).
 *
 * Fetched by our server from DuckDuckGo's icon service, so the user's browser
 * never contacts a third party: nobody outside learns their IP or which
 * companies they track. Cached for weeks per host, shared by every user; the
 * host is the only input, never anything about the user.
 */
export async function faviconDataUri(host: string): Promise<string | null> {
  "use cache";
  cacheLife("weeks");

  if (!HOSTNAME.test(host)) return null;

  try {
    const response = await fetch(
      `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`,
      { signal: AbortSignal.timeout(3000) },
    );
    if (!response.ok) return null;

    const type = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!ALLOWED_TYPES.has(type)) return null;

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_BYTES) return null;

    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    // Timeout, network error or bad response: initials are fine.
    return null;
  }
}

/** Favicon for a stored company website (already normalized to http(s)). */
export async function companyLogo(website: string | null) {
  if (!website) return null;
  try {
    return await faviconDataUri(
      new URL(website).hostname.replace(/^www\./, ""),
    );
  } catch {
    return null;
  }
}
