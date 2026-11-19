/**
 * Development-only preview of the app without signing in, to iterate on the UI.
 *
 * On only when BOTH hold: `next dev` (NODE_ENV is "development") and
 * DEV_PREVIEW_NO_AUTH=1 in the environment. `next build` always sets NODE_ENV
 * to "production", so a deployed app can never enter this mode.
 * Server Actions still call requireUser(), so nothing can be written in preview.
 */
export function isAuthPreview(
  env: Partial<
    Record<"NODE_ENV" | "DEV_PREVIEW_NO_AUTH", string>
  > = process.env,
) {
  return env.NODE_ENV === "development" && env.DEV_PREVIEW_NO_AUTH === "1";
}
