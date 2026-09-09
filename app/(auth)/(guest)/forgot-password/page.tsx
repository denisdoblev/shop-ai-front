import type { Metadata } from "next";

import { getSafeReturnTo, withReturnTo } from "@/lib/auth/redirects";

import { AuthPlaceholder } from "../../_components/AuthPlaceholder";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Consulta el estado del flujo de recuperación de contraseña de ShopAI.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/forgot-password">) {
  const returnTo = getSafeReturnTo((await searchParams).returnTo);

  return (
    <AuthPlaceholder
      eyebrow="Acceso a tu cuenta"
      title="Recuperación de contraseña"
      description="El flujo de recuperación de contraseña todavía no está disponible. No se enviará ningún correo ni se modificarán credenciales desde esta pantalla."
      backHref={withReturnTo("/login", returnTo)}
    />
  );
}
