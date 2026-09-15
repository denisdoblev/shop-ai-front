import { describe, expect, it } from "vitest";
import { createProductFormSchema, createProductSlug, productFormSchema, productPriceSchema } from "./ProductFormSchema";

const valid = {
  brandId: "5f9f9e2b-2f4d-4f62-a0f6-a711ab853b7b",
  categoryId: "6f9f9e2b-2f4d-4f62-a0f6-a711ab853b7b",
  description: "",
  model: "",
  name: "Cámara Pro",
  slug: "camara-pro",
  specifications: {},
};

describe("productFormSchema", () => {
  it("accepts false, null, strings and numbers as distinct specification values", () => {
    expect(productFormSchema.safeParse({ ...valid, specifications: {
      "1f9f9e2b-2f4d-4f62-a0f6-a711ab853b7b": false,
      "2f9f9e2b-2f4d-4f62-a0f6-a711ab853b7b": null,
      "3f9f9e2b-2f4d-4f62-a0f6-a711ab853b7b": "OLED",
      "4f9f9e2b-2f4d-4f62-a0f6-a711ab853b7b": 12.5,
    } }).success).toBe(true);
  });

  it("requires valid references, name and slug", () => {
    expect(productFormSchema.safeParse({ ...valid, brandId: "", name: "", slug: "Bad Slug" }).success).toBe(false);
  });

  it("requires the initial price only when creating", () => {
    expect(productFormSchema.safeParse(valid).success).toBe(true);
    expect(createProductFormSchema.safeParse(valid).success).toBe(false);
    expect(createProductFormSchema.safeParse({ ...valid, initialPrice: 0 }).success).toBe(true);
    expect(createProductFormSchema.safeParse({ ...valid, initialPrice: 19.99 }).success).toBe(true);
  });

  it.each([-0.01, 1.001, 10_000_000_000, Number.NaN])("rejects the invalid price %s", (price) => {
    expect(productPriceSchema.safeParse({ price }).success).toBe(false);
    expect(createProductFormSchema.safeParse({ ...valid, initialPrice: price }).success).toBe(false);
  });

  it("rejects non-numeric prices", () => {
    expect(productPriceSchema.safeParse({ price: "19.99" }).success).toBe(false);
  });

  it("creates a URL-safe slug", () => {
    expect(createProductSlug("Cámara Pro 2026")).toBe("camara-pro-2026");
  });
});
