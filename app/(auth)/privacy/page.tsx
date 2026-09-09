import type { Metadata } from "next";

import { AuthPlaceholder } from "../_components/AuthPlaceholder";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Consulta el estado de la política de privacidad de ShopAI.",
};

export default function PrivacyPage() {
  return (
    <AuthPlaceholder
      eyebrow="Información legal"
      title="Política de privacidad"
      description="Esta página está reservada para la política de privacidad de ShopAI. El contenido legal definitivo todavía está pendiente de definición."
    />
  );
}
