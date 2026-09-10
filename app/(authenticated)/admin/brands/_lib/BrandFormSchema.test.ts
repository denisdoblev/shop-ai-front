import { describe, expect, it } from "vitest";

import {
  BRAND_NAME_MAX_LENGTH,
  BRAND_SLUG_MAX_LENGTH,
  brandFormSchema,
  createBrandSlug,
} from "./BrandFormSchema";

describe("brandFormSchema", () => {
  it("trims valid form values", () => {
    expect(
      brandFormSchema.parse({
        name: "  Sony  ",
        slug: "  sony-audio  ",
      }),
    ).toEqual({
      name: "Sony",
      slug: "sony-audio",
    });
  });

  it.each<[string, string, "name" | "slug"]>([
    ["", "sony", "name"],
    ["Sony", "", "slug"],
    ["Sony", "Sony", "slug"],
    ["Sony", "-sony", "slug"],
    ["Sony", "sony--audio", "slug"],
    ["Sony", "sony_audio", "slug"],
  ])("rejects invalid values", (name, slug, field) => {
    const result = brandFormSchema.safeParse({ name, slug });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors[field]).toBeDefined();
    }
  });

  it("enforces API length limits", () => {
    expect(
      brandFormSchema.safeParse({
        name: "a".repeat(BRAND_NAME_MAX_LENGTH + 1),
        slug: "a".repeat(BRAND_SLUG_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
  });
});

describe("createBrandSlug", () => {
  it.each([
    ["Café del Mar", "cafe-del-mar"],
    ["  Audio & Vídeo  ", "audio-video"],
    ["North---Star", "north-star"],
    ["Ñandú 2000!", "nandu-2000"],
  ])("normalizes %s", (value, expected) => {
    expect(createBrandSlug(value)).toBe(expected);
  });

  it("truncates without leaving a trailing separator", () => {
    expect(
      createBrandSlug(`${"a".repeat(BRAND_SLUG_MAX_LENGTH - 1)} long`),
    ).toBe("a".repeat(BRAND_SLUG_MAX_LENGTH - 1));
  });
});
