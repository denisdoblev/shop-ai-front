import { describe, expect, it } from "vitest";
import { parseAssistantSearchParams, parseCompareSearchParams, parseExploreSearchParams } from "./discovery-search-params";

describe("discovery search params", () => {
  it("normaliza q antes de buscar con el asistente", () => { expect(parseAssistantSearchParams({ q: "  laptop   " })).toBe("laptop"); expect(parseAssistantSearchParams({ q: ["uno", "dos"] })).toBe(""); });
  it("acepta sólo categoryId UUID para explorar", () => { expect(parseExploreSearchParams({ categoryId: "4f0e2f72-30ca-4ee1-b372-8fd57a873323" })).toBe("4f0e2f72-30ca-4ee1-b372-8fd57a873323"); expect(parseExploreSearchParams({ categoryId: "bad" })).toBe(""); });
  it("acepta sólo productId UUID para comparar", () => { expect(parseCompareSearchParams({ productId: "4f0e2f72-30ca-4ee1-b372-8fd57a873323" })).toBe("4f0e2f72-30ca-4ee1-b372-8fd57a873323"); expect(parseCompareSearchParams({ productId: ["one"] })).toBe(""); });
});
