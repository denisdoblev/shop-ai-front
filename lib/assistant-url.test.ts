import { describe, expect, it } from "vitest";

import {
  buildAssistantHref,
  isAssistantProductId,
  parseAssistantSearchParams,
} from "./assistant-url";

const productId = "4f0e2f72-30ca-4ee1-b372-8fd57a873323";

describe("assistant URL", () => {
  it("normaliza la búsqueda y valida productId", () => {
    expect(parseAssistantSearchParams({ q: "  laptop  ", productId })).toEqual({
      productId,
      query: "laptop",
    });
    expect(parseAssistantSearchParams({ q: ["uno", "dos"], productId: "bad" })).toEqual({
      productId: null,
      query: "",
    });
    expect(isAssistantProductId(productId)).toBe(true);
    expect(isAssistantProductId("not-a-uuid")).toBe(false);
  });

  it("construye URLs enfocadas y conserva la búsqueda de origen", () => {
    expect(buildAssistantHref({ productId })).toBe(`/assistant?productId=${productId}`);
    expect(buildAssistantHref({ productId, query: " audio " })).toBe(
      `/assistant?productId=${productId}&q=audio`,
    );
    expect(buildAssistantHref({ productId: "bad", query: "audio" })).toBe(
      "/assistant?q=audio",
    );
    expect(buildAssistantHref()).toBe("/assistant");
  });
});
