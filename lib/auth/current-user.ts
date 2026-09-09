import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { checkAuthStatus } from "./server";
import { AUTH_COOKIE_NAME } from "./session";
import type { AuthenticatedUser } from "./types";

export const getCurrentUser = cache(
  async (): Promise<AuthenticatedUser | null> => {
    const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    try {
      const auth = await checkAuthStatus(token);

      return {
        email: auth.email,
        fullname: auth.fullname,
        id: auth.id,
        isActive: auth.isActive,
        roles: auth.roles,
      };
    } catch {
      return null;
    }
  },
);
