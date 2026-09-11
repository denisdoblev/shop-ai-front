import { describe, expect, it } from "vitest";

import {
  CATEGORY_NAME_MAX_LENGTH,
  CATEGORY_SLUG_MAX_LENGTH,
  categoryFormSchema,
  createCategorySlug,
} from "./CategoryFormSchema";

describe("categoryFormSchema", () => {
  it("trims valid category values and accepts nullable hierarchy", () => {
    expect(
      categoryFormSchema.parse({
        description: "  Personal audio  ",
        name: "  Headphones  ",
        parentId: null,
        slug: "  headphones  ",
      }),
    ).toEqual({
      description: "Personal audio",
      name: "Headphones",
      parentId: null,
      slug: "headphones",
    });
  });

  it("rejects invalid required, UUID, length, and slug values", () => {
    const result = categoryFormSchema.safeParse({
      description: "",
      name: "x".repeat(CATEGORY_NAME_MAX_LENGTH + 1),
      parentId: "not-a-uuid",
      slug: `Invalid-${"x".repeat(CATEGORY_SLUG_MAX_LENGTH)}`,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        name: expect.any(Array),
        parentId: expect.any(Array),
        slug: expect.any(Array),
      });
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
