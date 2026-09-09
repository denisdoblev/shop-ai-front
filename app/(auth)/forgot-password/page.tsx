import type { Metadata } from "next";

import { AuthPlaceholder } from "../_components/AuthPlaceholder";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Consulta el estado del flujo de recuperación de contraseña de ShopAI.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPlaceholder
      eyebrow="Acceso a tu cuenta"
      title="Recuperación de contraseña"
      description="El flujo de recuperación de contraseña todavía no está disponible. No se enviará ningún correo ni se modificarán credenciales desde esta pantalla."
    />
  );
}
