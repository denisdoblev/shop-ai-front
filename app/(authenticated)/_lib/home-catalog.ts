import "server-only";

import type { components } from "@/lib/api/generated";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";

import type {
  FeaturedProduct,
  FeaturedProducts,
  HomeCategory,
} from "../_types/Home";

export const HOME_CATEGORY_LIMIT = 6;
export const FEATURED_PRODUCT_LIMIT = 3;

type CategoryResponse = components["schemas"]["CategoryResponseDto"];
type ProductResponse = components["schemas"]["ProductResponseDto"];
type ProductImageResponse = components["schemas"]["ProductImageResponseDto"];
type ProductPriceResponse = components["schemas"]["ProductPriceResponseDto"];

export function normalizeHomeCategory(category: CategoryResponse): HomeCategory {
  return {
    description: category.description?.trim() || null,
    id: category.id,
    name: category.name,
  };
}

export function getFirstImageUrl(images: ProductImageResponse[]): string | null {
  const url = images[0]?.url;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

export function getLatestPrice(
  prices: ProductPriceResponse[],
): Pick<FeaturedProduct, "currency" | "price"> {
  const latest = prices.toSorted((left, right) => {
    const recordedDifference = Date.parse(right.recordedAt) - Date.parse(left.recordedAt);
    if (recordedDifference !== 0) return recordedDifference;

    const createdDifference = Date.parse(right.createdAt) - Date.parse(left.createdAt);
    return createdDifference !== 0 ? createdDifference : right.id.localeCompare(left.id);
  })[0];

  return latest
    ? { currency: latest.currency, price: latest.price }
    : { currency: null, price: null };
}

export async function loadHomeCategories(): Promise<HomeCategory[]> {
  const categories = await authenticatedServerRequest<CategoryResponse[]>(
    `/api/categories?limit=${HOME_CATEGORY_LIMIT}&offset=0`,
    { cache: "no-store" },
  );

  return categories.slice(0, HOME_CATEGORY_LIMIT).map(normalizeHomeCategory);
}

async function enrichProduct(
  product: ProductResponse,
): Promise<{ item: FeaturedProduct; partialFailure: boolean }> {
  const productId = encodeURIComponent(product.id);
  const [imagesResult, pricesResult] = await Promise.allSettled([
    authenticatedServerRequest<ProductImageResponse[]>(
      `/api/products/${productId}/images`,
      { cache: "no-store" },
    ),
    authenticatedServerRequest<ProductPriceResponse[]>(
      `/api/products/${productId}/prices`,
      { cache: "no-store" },
    ),
  ]);
  const images = imagesResult.status === "fulfilled" ? imagesResult.value : [];
  const prices = pricesResult.status === "fulfilled" ? pricesResult.value : [];
  const latestPrice = getLatestPrice(prices);

  return {
    item: {
      ...latestPrice,
      description: product.description?.trim() || null,
      id: product.id,
      imageUrl: getFirstImageUrl(images),
      model: product.model?.trim() || null,
      name: product.name,
    },
    partialFailure:
      imagesResult.status === "rejected" || pricesResult.status === "rejected",
  };
}

export async function loadFeaturedProducts(): Promise<FeaturedProducts> {
  const products = await authenticatedServerRequest<ProductResponse[]>(
    `/api/products?limit=${FEATURED_PRODUCT_LIMIT}&offset=0`,
    { cache: "no-store" },
  );
  const enriched = await Promise.all(
    products.slice(0, FEATURED_PRODUCT_LIMIT).map(enrichProduct),
  );

  return {
    hasPartialFailure: enriched.some(({ partialFailure }) => partialFailure),
    items: enriched.map(({ item }) => item),
  };
}
