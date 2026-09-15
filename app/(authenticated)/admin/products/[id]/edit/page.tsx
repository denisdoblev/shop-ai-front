import { notFound } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { ProductForm } from "../../_components/ProductForm";
import { getAllBrandOptions, getAllCategoryOptions, getProduct, getProductPrices, getProductSpecifications } from "../../_lib/products";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuthenticatedUser();
  const { id } = await params;
  const [product, specifications, prices, brands, categories] = await Promise.all([getProduct(id), getProductSpecifications(id), getProductPrices(id), getAllBrandOptions(), getAllCategoryOptions()]);
  if (!product || !specifications || !prices) notFound();
  return <ProductForm brands={brands} categories={categories} mode="edit" prices={prices} product={product} specifications={specifications} />;
}
