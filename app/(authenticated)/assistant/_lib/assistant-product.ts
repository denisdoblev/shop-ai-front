import "server-only";

import type { components } from "@/lib/api/generated";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";

import { getFirstImageUrl, getLatestPrice } from "../../_lib/home-catalog";
import type { AssistantProduct } from "../_types/Assistant";

type Brand = components["schemas"]["BrandResponseDto"];
type Product = components["schemas"]["ProductResponseDto"];
type ProductImage = components["schemas"]["ProductImageResponseDto"];
type ProductPrice = components["schemas"]["ProductPriceResponseDto"];

export async function loadAssistantProduct(
  productId: string,
): Promise<AssistantProduct> {
  const product = await authenticatedServerRequest<Product>(
    `/api/products/${encodeURIComponent(productId)}`,
    { cache: "no-store" },
  );
  const encodedProductId = encodeURIComponent(product.id);
  const [brandResult, imagesResult, pricesResult] = await Promise.allSettled([
    authenticatedServerRequest<Brand>(
      `/api/brands/${encodeURIComponent(product.brandId)}`,
      { cache: "no-store" },
    ),
    authenticatedServerRequest<ProductImage[]>(
      `/api/products/${encodedProductId}/images`,
      { cache: "no-store" },
    ),
    authenticatedServerRequest<ProductPrice[]>(
      `/api/products/${encodedProductId}/prices`,
      { cache: "no-store" },
    ),
  ]);
  const latestPrice = getLatestPrice(
    pricesResult.status === "fulfilled" ? pricesResult.value : [],
  );

  return {
    ...latestPrice,
    brandName:
      brandResult.status === "fulfilled" ? brandResult.value.name : null,
    description: product.description?.trim() || null,
    id: product.id,
    imageUrl: getFirstImageUrl(
      imagesResult.status === "fulfilled" ? imagesResult.value : [],
    ),
    model: product.model?.trim() || null,
    name: product.name,
  };
}
