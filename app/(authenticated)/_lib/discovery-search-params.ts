import { z } from "zod";

import type {
  ExploreSearchFilters,
  PriceRange,
  ProductSearchSort,
} from "../explore/_types/Explore";

type SearchParam = string | string[] | undefined;
const uuidSchema = z.string().uuid();

export const MAX_COMPARE_PRODUCTS = 4;

const PRICE_RANGES = new Set<PriceRange>([
  "<500",
  "500-999.99",
  "1000-1499.99",
  ">=1500",
]);
const SORTS = new Set<ProductSearchSort>([
  "relevance",
  "name-asc",
  "name-desc",
  "price-asc",
  "price-desc",
  "newest",
]);
const DEFAULT_EXPLORE_LIMIT = 12;

function single(value: SearchParam) { return typeof value === "string" ? value : ""; }
function many(value: SearchParam): string[] {
  return Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
}
function positiveInteger(value: SearchParam, fallback: number, allowZero = false) {
  const parsed = Number(single(value));
  return Number.isInteger(parsed) && parsed >= (allowZero ? 0 : 1) ? parsed : fallback;
}

export function parseAssistantSearchParams(params: Record<string, SearchParam>) { return single(params.q).trim().slice(0, 100); }
export function parseExploreSearchParams(
  params: Record<string, SearchParam>,
): ExploreSearchFilters {
  const limit = Math.min(48, positiveInteger(params.limit, DEFAULT_EXPLORE_LIMIT));
  const sort = single(params.sort) as ProductSearchSort;

  return {
    q: single(params.q).trim().slice(0, 100),
    categoryIds: [...new Set(many(params.categoryId).filter((value) => uuidSchema.safeParse(value).success))].slice(0, 20),
    priceRanges: [...new Set(many(params.priceRange).filter((value): value is PriceRange => PRICE_RANGES.has(value as PriceRange)))],
    featureIds: [...new Set(many(params.featureId).filter((value) => uuidSchema.safeParse(value).success))].slice(0, 20),
    sort: SORTS.has(sort) ? sort : "relevance",
    limit,
    offset: positiveInteger(params.offset, 0, true),
  };
}

export function buildExploreHref(filters: ExploreSearchFilters): string {
  const searchParams = new URLSearchParams();
  if (filters.q) searchParams.set("q", filters.q);
  filters.categoryIds.forEach((value) => searchParams.append("categoryId", value));
  filters.priceRanges.forEach((value) => searchParams.append("priceRange", value));
  filters.featureIds.forEach((value) => searchParams.append("featureId", value));
  if (filters.sort !== "relevance") searchParams.set("sort", filters.sort);
  if (filters.limit !== DEFAULT_EXPLORE_LIMIT) searchParams.set("limit", String(filters.limit));
  if (filters.offset > 0) searchParams.set("offset", String(filters.offset));
  const query = searchParams.toString();
  return query ? `/explore?${query}` : "/explore";
}

export function normalizeCompareProductIds(values: readonly string[]) {
  return [...new Set(values.filter((value) => uuidSchema.safeParse(value).success))].slice(
    0,
    MAX_COMPARE_PRODUCTS,
  );
}

export function parseCompareSearchParams(params: Record<string, SearchParam>) {
  const values = Array.isArray(params.productId)
    ? params.productId
    : params.productId
      ? [params.productId]
      : [];

  return normalizeCompareProductIds(values);
}

function buildProductSelectionHref(pathname: "/" | "/compare", productIds: readonly string[]) {
  const searchParams = new URLSearchParams();
  normalizeCompareProductIds(productIds).forEach((productId) => {
    searchParams.append("productId", productId);
  });
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildCompareHref(productIds: readonly string[]) {
  return buildProductSelectionHref("/compare", productIds);
}

export function buildHomeCompareHref(productIds: readonly string[]) {
  return buildProductSelectionHref("/", productIds);
}
