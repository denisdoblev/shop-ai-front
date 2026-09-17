import "server-only";

import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";

import type {
  ExploreSearchFilters,
  Favorite,
  ProductSearchResponse,
} from "../_types/Explore";

export function buildProductSearchPath(filters: ExploreSearchFilters): string {
  const searchParams = new URLSearchParams({
    limit: String(filters.limit),
    offset: String(filters.offset),
    sort: filters.sort,
  });
  if (filters.q) searchParams.set("q", filters.q);
  filters.categoryIds.forEach((value) => searchParams.append("categoryId", value));
  filters.priceRanges.forEach((value) => searchParams.append("priceRange", value));
  filters.featureIds.forEach((value) => searchParams.append("featureId", value));
  return `/api/products/search?${searchParams.toString()}`;
}

export function searchProducts(filters: ExploreSearchFilters) {
  return authenticatedServerRequest<ProductSearchResponse>(
    buildProductSearchPath(filters),
    { cache: "no-store" },
  );
}

export function loadFavorites() {
  return authenticatedServerRequest<Favorite[]>("/api/favorites", {
    cache: "no-store",
  });
}
