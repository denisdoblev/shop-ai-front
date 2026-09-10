import { notFound } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/guards";

import { BrandForm } from "../../_components/BrandForm";
import { getBrand } from "../../_lib/brands";

type EditBrandPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBrandPage({ params }: EditBrandPageProps) {
  await requireAuthenticatedUser();

  const { id } = await params;
  const brand = await getBrand(id);

  if (!brand) notFound();

  return (
    <BrandForm
      mode="edit"
      brand={{
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
      }}
    />
  );
}
