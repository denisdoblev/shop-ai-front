import { notFound } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { ProductForm } from "../../_components/ProductForm";
import { getAllBrandOptions, getAllCategoryOptions, getProduct, getProductSpecifications } from "../../_lib/products";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuthenticatedUser();
  const { id } = await params;
  const [product, specifications, brands, categories] = await Promise.all([getProduct(id), getProductSpecifications(id), getAllBrandOptions(), getAllCategoryOptions()]);
  if (!product || !specifications) notFound();
  return <ProductForm brands={brands} categories={categories} mode="edit" product={product} specifications={specifications} />;
}
