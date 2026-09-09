import type { Metadata } from "next";

import { getSafeReturnTo } from "@/lib/auth/redirects";

import { AuthForm } from "../../_components/AuthForm";
import { AuthShell } from "../../_components/AuthShell";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta de ShopAI y guarda tus productos favoritos.",
};

export default async function RegisterPage({
  searchParams,
}: PageProps<"/register">) {
  const returnTo = getSafeReturnTo((await searchParams).returnTo);

  return (
    <AuthShell mode="register">
      <AuthForm mode="register" returnTo={returnTo} />
    </AuthShell>
  );
}
