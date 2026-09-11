import { notFound } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/guards";

import { CategoryForm } from "../../_components/CategoryForm";
import { getAllCategories, getCategory } from "../../_lib/categories";
import { getAvailableParentCategories } from "../../_lib/CategoryHierarchy";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  await requireAuthenticatedUser();

  const { id } = await params;
  const [category, categories] = await Promise.all([
    getCategory(id),
    getAllCategories(),
  ]);

  if (!category) notFound();

  return (
    <CategoryForm
      mode="edit"
      category={{
        description: category.description,
        id: category.id,
        name: category.name,
        parentId: category.parentId,
        slug: category.slug,
      }}
      parentCategories={getAvailableParentCategories(categories, category.id)}
    />
  );
}
