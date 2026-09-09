import type { Metadata } from "next";

import { AuthPlaceholder } from "../_components/AuthPlaceholder";

export const metadata: Metadata = {
  title: "Términos del servicio",
  description: "Consulta el estado de los términos del servicio de ShopAI.",
};

export default function TermsPage() {
  return (
    <AuthPlaceholder
      eyebrow="Información legal"
      title="Términos del servicio"
      description="Esta página está reservada para los términos del servicio de ShopAI. El contenido legal definitivo todavía está pendiente de definición."
    />
  );
}
