import type { Metadata } from "next";

import { getSafeReturnTo } from "@/lib/auth/redirects";

import { AuthForm } from "../../_components/AuthForm";
import { AuthShell } from "../../_components/AuthShell";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta de ShopAI.",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const returnTo = getSafeReturnTo((await searchParams).returnTo);

  return (
    <AuthShell mode="login">
      <AuthForm mode="login" returnTo={returnTo} />
    </AuthShell>
  );
}
