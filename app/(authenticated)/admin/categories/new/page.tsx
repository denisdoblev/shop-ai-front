import { requireAuthenticatedUser } from "@/lib/auth/guards";

import { CategoryForm } from "../_components/CategoryForm";
import { getAllCategories } from "../_lib/categories";

export default async function NewCategoryPage() {
  await requireAuthenticatedUser();

  const categories = await getAllCategories();

  return <CategoryForm mode="create" parentCategories={categories} />;
}
