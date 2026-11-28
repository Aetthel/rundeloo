/**
 * Longest role title we store. Board cards show one line, so titles stay as
 * short as the role itself: "Frontend developer", not the posting's headline.
 */
export const ROLE_TITLE_MAX = 32;

// Postings append team, product, location or level after one of these.
const SUFFIX = /\s*(?:,|\(|\||:|@|\s[-–—/]\s).*$/u;

/**
 * Brief role title from whatever the posting says:
 * "Frontend Engineer, Growth (Remote)" → "Frontend Engineer".
 * Keeps the first part only and tidies the spacing; never returns empty
 * when the input has text.
 */
export function briefRoleTitle(raw: string): string {
  const tidy = raw.replace(/\s+/g, " ").trim();
  return tidy.replace(SUFFIX, "").trim() || tidy;
}

const DAY = 86_400_000;
/** Days after applying with no news before a follow-up is due. */
export const FOLLOW_UP_DAYS = 7;

export type NextStep =
  | { key: "send" }
  | { key: "sendBy"; date: string }
  | { key: "wait" }
  | { key: "followUp" }
  | { key: "prepare" }
  | { key: "answer" }
  | { key: "reconnect" };

/**
 * What to do next with an application, derived from its status and dates
 * (table view, screen 09). Rejected applications have no next step.
 */
export function nextStepOf(
  app: {
    status: string;
    appliedAt: string | null;
    deadline: string | null;
  },
  now: Date,
): NextStep | null {
  switch (app.status) {
    case "saved":
      return app.deadline
        ? { key: "sendBy", date: app.deadline }
        : { key: "send" };
    case "applied": {
      const days = app.appliedAt
        ? (now.getTime() - new Date(app.appliedAt).getTime()) / DAY
        : 0;
      return days >= FOLLOW_UP_DAYS ? { key: "followUp" } : { key: "wait" };
    }
    case "interview":
      return { key: "prepare" };
    case "offer":
      return { key: "answer" };
    case "on_hold":
      return { key: "reconnect" };
    default:
      return null;
  }
}
