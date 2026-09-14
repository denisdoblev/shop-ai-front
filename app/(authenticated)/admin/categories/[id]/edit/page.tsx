import { notFound } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/guards";

import { CategoryForm } from "../../_components/CategoryForm";
import {
  getAllCategoryAttributeOptions,
  getCategoryAttributeAssignments,
} from "../../_lib/category-attributes";
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
  const [category, categories, availableAttributes, assignments] =
    await Promise.all([
      getCategory(id),
      getAllCategories(),
      getAllCategoryAttributeOptions(),
      getCategoryAttributeAssignments(id),
    ]);

  if (!category || !assignments) notFound();

  return (
    <CategoryForm
      mode="edit"
      availableAttributes={availableAttributes}
      assignedAttributeIds={assignments.map(
        (assignment) => assignment.attributeId,
      )}
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
