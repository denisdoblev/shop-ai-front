import "server-only";

import type { components } from "@/lib/api/generated";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";
import { HttpError } from "@/lib/http/errors";
import type { Product, ProductOption, ProductSpecifications } from "../_types/Product";

export const PRODUCTS_PAGE_SIZE = 10;
const OPTIONS_BATCH_SIZE = 100;
type ProductResponse = components["schemas"]["ProductResponseDto"];
type SpecificationResponse = components["schemas"]["ProductSpecificationResponseDto"];

function normalizeProduct(product: ProductResponse): Product {
  return {
    ...product,
    description: typeof product.description === "string" ? product.description : null,
    model: typeof product.model === "string" ? product.model : null,
  };
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    return normalizeProduct(await authenticatedServerRequest<ProductResponse>(`/api/products/${encodeURIComponent(id)}`, { cache: "no-store" }));
  } catch (error: unknown) {
    if (error instanceof HttpError && (error.status === 400 || error.status === 404)) return null;
    throw error;
  }
}

export async function getProducts(options: { brandId?: string; categoryId?: string; name?: string; page: number }) {
  const query = new URLSearchParams({ limit: String(PRODUCTS_PAGE_SIZE + 1), offset: String((options.page - 1) * PRODUCTS_PAGE_SIZE) });
  if (options.name) query.set("name", options.name);
  if (options.brandId) query.set("brandId", options.brandId);
  if (options.categoryId) query.set("categoryId", options.categoryId);
  const items = await authenticatedServerRequest<ProductResponse[]>(`/api/products?${query}`, { cache: "no-store" });
  return { hasNext: items.length > PRODUCTS_PAGE_SIZE, items: items.slice(0, PRODUCTS_PAGE_SIZE).map(normalizeProduct) };
}

async function getAll(path: "/api/brands" | "/api/categories"): Promise<ProductOption[]> {
  const result: ProductOption[] = [];
  for (let offset = 0; ; offset += OPTIONS_BATCH_SIZE) {
    const batch = await authenticatedServerRequest<ProductOption[]>(`${path}?limit=${OPTIONS_BATCH_SIZE}&offset=${offset}`, { cache: "no-store" });
    result.push(...batch.map(({ id, name }) => ({ id, name })));
    if (batch.length < OPTIONS_BATCH_SIZE) return result;
  }
}

export const getAllBrandOptions = () => getAll("/api/brands");
export const getAllCategoryOptions = () => getAll("/api/categories");

export async function getProductSpecifications(id: string): Promise<ProductSpecifications | null> {
  try {
    const values = await authenticatedServerRequest<SpecificationResponse[]>(`/api/products/${encodeURIComponent(id)}/specifications`, { cache: "no-store" });
    return Object.fromEntries(values.map((item) => [item.attributeId, item.value]));
  } catch (error: unknown) {
    if (error instanceof HttpError && (error.status === 400 || error.status === 404)) return null;
    throw error;
  }
}
