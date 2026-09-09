import type { Metadata } from "next";

import { AuthForm } from "../_components/AuthForm";
import { AuthShell } from "../_components/AuthShell";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta de ShopAI y guarda tus productos favoritos.",
};

export default function RegisterPage() {
  return (
    <AuthShell mode="register">
      <AuthForm mode="register" />
    </AuthShell>
  );
}
