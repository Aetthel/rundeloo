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
