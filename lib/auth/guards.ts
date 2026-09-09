import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser } from "./current-user";
import {
  REQUEST_PATH_HEADER,
  getSafeReturnTo,
  withReturnTo,
} from "./redirects";
import type { AuthenticatedUser } from "./types";

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const [user, requestHeaders] = await Promise.all([
    getCurrentUser(),
    headers(),
  ]);

  if (!user) {
    const returnTo = getSafeReturnTo(requestHeaders.get(REQUEST_PATH_HEADER));
    redirect(withReturnTo("/login", returnTo));
  }

  return user;
}

export async function redirectAuthenticatedUser(): Promise<void> {
  if (await getCurrentUser()) redirect("/");
}
