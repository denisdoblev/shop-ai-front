import { notFound } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/guards";

import { AttributeForm } from "../../_components/AttributeForm";
import { getAttribute } from "../../_lib/attributes";

type EditAttributePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAttributePage({
  params,
}: EditAttributePageProps) {
  await requireAuthenticatedUser();

  const { id } = await params;
  const attribute = await getAttribute(id);

  if (!attribute) notFound();

  return (
    <AttributeForm
      mode="edit"
      attribute={{
        dataType: attribute.dataType,
        id: attribute.id,
        name: attribute.name,
        slug: attribute.slug,
        unit: attribute.unit,
      }}
    />
  );
}
