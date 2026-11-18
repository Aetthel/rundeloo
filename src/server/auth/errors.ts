import "server-only";

import type { AuthError } from "@supabase/supabase-js";

/** i18n keys under "auth.errors". The raw Supabase message never reaches the client. */
export type AuthErrorKey =
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "emailTaken"
  | "weakPassword"
  | "samePassword"
  | "rateLimited"
  | "sessionExpired"
  | "unexpected";

const BY_CODE: Record<string, AuthErrorKey> = {
  invalid_credentials: "invalidCredentials",
  email_not_confirmed: "emailNotConfirmed",
  user_already_exists: "emailTaken",
  email_exists: "emailTaken",
  weak_password: "weakPassword",
  same_password: "samePassword",
  over_request_rate_limit: "rateLimited",
  over_email_send_rate_limit: "rateLimited",
  session_not_found: "sessionExpired",
  session_expired: "sessionExpired",
};

export function authErrorKey(
  error: Pick<AuthError, "code" | "status">,
): AuthErrorKey {
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];
  if (error.status === 429) return "rateLimited";
  return "unexpected";
}
