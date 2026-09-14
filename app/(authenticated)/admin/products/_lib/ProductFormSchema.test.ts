import { describe, expect, it } from "vitest";
import { createProductSlug, productFormSchema } from "./ProductFormSchema";

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

  it("creates a URL-safe slug", () => {
    expect(createProductSlug("Cámara Pro 2026")).toBe("camara-pro-2026");
  });
});
