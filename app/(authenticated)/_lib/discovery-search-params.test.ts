import { describe, expect, it } from "vitest";
import {
  buildCompareHref,
  buildExploreHref,
  buildHomeCompareHref,
  MAX_COMPARE_PRODUCTS,
  normalizeCompareProductIds,
  parseCompareSearchParams,
  parseExploreSearchParams,
} from "./discovery-search-params";

const firstId = "4f0e2f72-30ca-4ee1-b372-8fd57a873323";
const secondId = "a8f9d1d4-f3c7-4fc8-a1f0-1537ac3d2f11";
const thirdId = "d2719b36-6b21-4a42-887f-82b3d2c980b9";
const fourthId = "3ad3a759-5005-46ca-997e-bc621de584b1";
const fifthId = "45a581e0-fc8f-473c-88fd-631faf64b5bf";

describe("discovery search params", () => {
  it("normaliza filtros repetidos de Explore", () => {
    expect(parseExploreSearchParams({
      categoryId: [firstId, "bad", firstId],
      featureId: secondId,
      priceRange: ["<500", "invalid"],
      q: "  laptop  ",
      sort: "price-asc",
      limit: "24",
      offset: "48",
    })).toEqual({
      q: "laptop",
      categoryIds: [firstId],
      featureIds: [secondId],
      priceRanges: ["<500"],
      sort: "price-asc",
      limit: 24,
      offset: 48,
    });
  });

  it("construye Explore sin parámetros inválidos y permite reiniciar offset", () => {
    const filters = parseExploreSearchParams({ categoryId: firstId, offset: "24" });
    expect(buildExploreHref({ ...filters, offset: 0 })).toBe(`/explore?categoryId=${firstId}`);
  });

  it("acepta productId escalar y repetido, descarta inválidos y duplicados", () => {
    expect(parseCompareSearchParams({ productId: firstId })).toEqual([firstId]);
    expect(
      parseCompareSearchParams({
        productId: [firstId, "invalid", secondId, firstId, thirdId],
      }),
    ).toEqual([firstId, secondId, thirdId]);
  });

  it("limita la comparación a los primeros cuatro UUID válidos", () => {
    expect(
      parseCompareSearchParams({
        productId: [firstId, secondId, thirdId, fourthId, fifthId],
      }),
    ).toEqual([firstId, secondId, thirdId, fourthId]);
    expect(parseCompareSearchParams({})).toEqual([]);
  });

  it("normaliza y construye las URLs compartidas de Inicio y comparación", () => {
    const values = [firstId, "invalid", secondId, firstId, thirdId, fourthId, fifthId];

    expect(normalizeCompareProductIds(values)).toEqual([
      firstId,
      secondId,
      thirdId,
      fourthId,
    ]);
    expect(normalizeCompareProductIds(values)).toHaveLength(MAX_COMPARE_PRODUCTS);
    expect(buildHomeCompareHref([firstId, secondId])).toBe(
      `/?productId=${firstId}&productId=${secondId}`,
    );
    expect(buildCompareHref([firstId, secondId])).toBe(
      `/compare?productId=${firstId}&productId=${secondId}`,
    );
    expect(buildHomeCompareHref([])).toBe("/");
    expect(buildCompareHref([])).toBe("/compare");
  });
});
