import { requireAuthenticatedUser } from "@/lib/auth/guards";

import { CategoryForm } from "../_components/CategoryForm";
import { getAllCategoryAttributeOptions } from "../_lib/category-attributes";
import { getAllCategories } from "../_lib/categories";

export default async function NewCategoryPage() {
  await requireAuthenticatedUser();

  const [categories, availableAttributes] = await Promise.all([
    getAllCategories(),
    getAllCategoryAttributeOptions(),
  ]);

  return (
    <CategoryForm
      availableAttributes={availableAttributes}
      mode="create"
      parentCategories={categories}
    />
  );
}
