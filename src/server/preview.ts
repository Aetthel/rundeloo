import "server-only";

import { isAuthPreview } from "@/lib/dev-preview";
import { getUser } from "@/server/auth/session";

/**
 * True when the dev-only UI preview is on and nobody is signed in: reads then
 * serve sample data instead of redirecting to /login (see src/lib/dev-preview.ts).
 * Always false in production builds. Writes keep requiring a real session.
 */
export async function servePreviewData() {
  return isAuthPreview() && !(await getUser());
}
