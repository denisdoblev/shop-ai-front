import { describe, expect, it } from "vitest";
import { parseAssistantSearchParams, parseCompareSearchParams, parseExploreSearchParams } from "./discovery-search-params";

const firstId = "4f0e2f72-30ca-4ee1-b372-8fd57a873323";
const secondId = "a8f9d1d4-f3c7-4fc8-a1f0-1537ac3d2f11";
const thirdId = "d2719b36-6b21-4a42-887f-82b3d2c980b9";
const fourthId = "3ad3a759-5005-46ca-997e-bc621de584b1";
const fifthId = "45a581e0-fc8f-473c-88fd-631faf64b5bf";

describe("discovery search params", () => {
  it("normaliza q antes de buscar con el asistente", () => { expect(parseAssistantSearchParams({ q: "  laptop   " })).toBe("laptop"); expect(parseAssistantSearchParams({ q: ["uno", "dos"] })).toBe(""); });
  it("acepta sólo categoryId UUID para explorar", () => { expect(parseExploreSearchParams({ categoryId: firstId })).toBe(firstId); expect(parseExploreSearchParams({ categoryId: "bad" })).toBe(""); });

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
});
