import type { components } from "@/lib/api/generated";

export type ProductSearchResponse = components["schemas"]["ProductSearchResponseDto"];
export type ProductSearchItem = components["schemas"]["ProductSearchItemDto"];
export type ProductSearchFacets = components["schemas"]["ProductSearchFacetsDto"];
export type Favorite = components["schemas"]["FavoriteResponseDto"];
export type PriceRange = ProductSearchFacets["prices"][number]["id"];
export type ProductSearchSort =
  | "relevance"
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "newest";

export type ExploreSearchFilters = {
  q: string;
  categoryIds: string[];
  priceRanges: PriceRange[];
  featureIds: string[];
  sort: ProductSearchSort;
  limit: number;
  offset: number;
};
