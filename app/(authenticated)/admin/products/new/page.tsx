import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { ProductForm } from "../_components/ProductForm";
import { getAllBrandOptions, getAllCategoryOptions } from "../_lib/products";

export default async function NewProductPage() {
  await requireAuthenticatedUser();
  const [brands, categories] = await Promise.all([getAllBrandOptions(), getAllCategoryOptions()]);
  return <ProductForm brands={brands} categories={categories} mode="create" />;
}
