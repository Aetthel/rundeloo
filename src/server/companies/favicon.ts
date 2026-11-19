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
      // No redirects: the only host we talk to is the one above.
      { signal: AbortSignal.timeout(3000), redirect: "error" },
    );
    if (!response.ok) return null;
    // Refuse oversized bodies before reading them into memory.
    const declared = Number(response.headers.get("content-length"));
    if (declared > MAX_BYTES) return null;

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

/**
 * Favicons for several websites, at most `limit` uncached fetches at a time, so
 * a user with hundreds of companies can't fire hundreds of requests per render.
 */
export async function companyLogos(websites: (string | null)[], limit = 6) {
  const results: (string | null)[] = new Array(websites.length).fill(null);
  let next = 0;
  const worker = async () => {
    while (next < websites.length) {
      const index = next++;
      results[index] = await companyLogo(websites[index]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, websites.length) }, worker),
  );
  return results;
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
