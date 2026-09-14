import { describe, expect, it } from "vitest";

import {
  CATEGORY_ATTRIBUTE_MAX_COUNT,
  CATEGORY_NAME_MAX_LENGTH,
  CATEGORY_SLUG_MAX_LENGTH,
  categoryFormSchema,
  createCategorySlug,
} from "./CategoryFormSchema";

describe("categoryFormSchema", () => {
  it("trims valid category values and accepts nullable hierarchy", () => {
    expect(
      categoryFormSchema.parse({
        attributeIds: [],
        description: "  Personal audio  ",
        name: "  Headphones  ",
        parentId: null,
        slug: "  headphones  ",
      }),
    ).toEqual({
      attributeIds: [],
      description: "Personal audio",
      name: "Headphones",
      parentId: null,
      slug: "headphones",
    });
  });

  it("rejects invalid required, UUID, length, and slug values", () => {
    const result = categoryFormSchema.safeParse({
      attributeIds: ["not-a-uuid"],
      description: "",
      name: "x".repeat(CATEGORY_NAME_MAX_LENGTH + 1),
      parentId: "not-a-uuid",
      slug: `Invalid-${"x".repeat(CATEGORY_SLUG_MAX_LENGTH)}`,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        attributeIds: expect.any(Array),
        name: expect.any(Array),
        parentId: expect.any(Array),
        slug: expect.any(Array),
      });
    }
  });

  it("rejects duplicate attribute assignments", () => {
    const attributeId = "e16b2c51-2b8a-4f48-bd68-d81197fe7270";
    const result = categoryFormSchema.safeParse({
      attributeIds: [attributeId, attributeId],
      description: "",
      name: "Audio",
      parentId: null,
      slug: "audio",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.attributeIds).toEqual([
        "No puedes asignar el mismo atributo más de una vez.",
      ]);
    }
  });

  it("limits the number of attributes assigned to a category", () => {
    const result = categoryFormSchema.safeParse({
      attributeIds: Array.from(
        { length: CATEGORY_ATTRIBUTE_MAX_COUNT + 1 },
        (_, index) => `00000000-0000-4000-8000-${index.toString().padStart(12, "0")}`,
      ),
      description: "",
      name: "Audio",
      parentId: null,
      slug: "audio",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.attributeIds).toContain(
        `No puedes asignar más de ${CATEGORY_ATTRIBUTE_MAX_COUNT} atributos a una categoría.`,
      );
    }
  });
});

describe("createCategorySlug", () => {
  it.each([
    ["Café y Audio", "cafe-y-audio"],
    ["  Smart & Home  ", "smart-home"],
    ["---", ""],
  ])("normalizes %s", (value, expected) => {
    expect(createCategorySlug(value)).toBe(expected);
  });
});
