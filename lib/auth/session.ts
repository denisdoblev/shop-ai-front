import "server-only";

export const AUTH_COOKIE_NAME = "shopai_session";
const AUTH_COOKIE_MAX_AGE = 2 * 60 * 60;

export function getSessionCookieOptions(remember: boolean) {
  return {
    httpOnly: true,
    maxAge: remember ? AUTH_COOKIE_MAX_AGE : undefined,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
