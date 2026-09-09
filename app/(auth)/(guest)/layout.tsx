import type { ReactNode } from "react";

import { redirectAuthenticatedUser } from "@/lib/auth/guards";

export default async function GuestLayout({ children }: { children: ReactNode }) {
  await redirectAuthenticatedUser();

  return children;
}
