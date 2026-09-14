import { requireAuthenticatedUser } from "@/lib/auth/guards";

import { ProductsCrud } from "./_components/ProductsCrud";
import { getAllBrandOptions, getAllCategoryOptions, getProducts } from "./_lib/products";
import { parseProductSearchParams } from "./_lib/product-search-params";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ProductsPage({ searchParams }: Props) {
  await requireAuthenticatedUser();
  const { brandId, categoryId, name, page } = parseProductSearchParams(
    await searchParams,
  );
  const [productsPage, brands, categories] = await Promise.all([
    getProducts({ brandId: brandId || undefined, categoryId: categoryId || undefined, name: name || undefined, page }),
    getAllBrandOptions(), getAllCategoryOptions(),
  ]);
  const brandNames = new Map(brands.map((item) => [item.id, item.name]));
  const categoryNames = new Map(categories.map((item) => [item.id, item.name]));
  return <ProductsCrud brandId={brandId} brands={brands} categories={categories} categoryId={categoryId} hasNext={productsPage.hasNext} name={name} page={page} products={productsPage.items.map((item) => ({ ...item, brandName: brandNames.get(item.brandId) ?? "Marca desconocida", categoryName: categoryNames.get(item.categoryId) ?? "Categoría desconocida" }))} />;
}
