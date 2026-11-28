import { z } from "zod";

import { briefRoleTitle, ROLE_TITLE_MAX } from "@/lib/applications";

// Error messages are i18n keys under "applications.errors".

/**
 * Role title as the application forms save it: cut down to the role itself
 * (see briefRoleTitle), then capped so it fits on one line of a board card.
 */
export const roleTitleSchema = z
  .string()
  .transform(briefRoleTitle)
  .pipe(
    z
      .string()
      .min(1, "roleTitleRequired")
      .max(ROLE_TITLE_MAX, "roleTitleTooLong"),
  );
