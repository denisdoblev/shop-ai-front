import { describe, expect, it } from "vitest";

import { parseProductSearchParams } from "./product-search-params";

const brandId = "3d6f0a36-40ed-4d30-ae15-7f12ab21379a";
const categoryId = "e16b2c51-2b8a-4f48-bd68-d81197fe7270";

describe("parseProductSearchParams", () => {
  it("keeps valid UUID filters and sanitizes name and page", () => {
    expect(
      parseProductSearchParams({
        brandId,
        categoryId,
        name: "  Cámara Pro  ",
        page: "3",
      }),
    ).toEqual({ brandId, categoryId, name: "Cámara Pro", page: 3 });
  });

  it("normalizes invalid UUID filters and page to empty defaults", () => {
    expect(
      parseProductSearchParams({
        brandId: "invalid",
        categoryId: "also-invalid",
        name: "   ",
        page: "0",
      }),
    ).toEqual({ brandId: "", categoryId: "", name: "", page: 1 });
  });

  it("ignores repeated parameters instead of choosing an ambiguous value", () => {
    expect(
      parseProductSearchParams({
        brandId: [brandId, "invalid"],
        categoryId: [categoryId, categoryId],
        name: ["first", "second"],
        page: ["2", "3"],
      }),
    ).toEqual({ brandId: "", categoryId: "", name: "", page: 1 });
  });
});
