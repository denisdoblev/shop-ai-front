import type { Metadata } from "next";

import { AuthForm } from "../_components/AuthForm";
import { AuthShell } from "../_components/AuthShell";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta de ShopAI.",
};

export default function LoginPage() {
  return (
    <AuthShell mode="login">
      <AuthForm mode="login" />
    </AuthShell>
  );
}
