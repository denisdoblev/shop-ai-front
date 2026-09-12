import { describe, expect, it } from "vitest";

import {
  ATTRIBUTE_NAME_MAX_LENGTH,
  ATTRIBUTE_SLUG_MAX_LENGTH,
  ATTRIBUTE_UNIT_MAX_LENGTH,
  attributeFormSchema,
  createAttributeSlug,
} from "./AttributeFormSchema";

describe("attributeFormSchema", () => {
  it("normalizes a valid attribute", () => {
    expect(
      attributeFormSchema.parse({
        dataType: "number",
        name: "  Duración de batería  ",
        slug: "  duracion-bateria  ",
        unit: "  horas  ",
      }),
    ).toEqual({
      dataType: "number",
      name: "Duración de batería",
      slug: "duracion-bateria",
      unit: "horas",
    });
  });

  it("requires a supported data type", () => {
    const result = attributeFormSchema.safeParse({
      dataType: undefined,
      name: "Bluetooth",
      slug: "bluetooth",
      unit: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.dataType).toContain(
        "Selecciona el tipo de dato.",
      );
    }
  });

  it("enforces field lengths and the slug format", () => {
    const result = attributeFormSchema.safeParse({
      dataType: "string",
      name: "x".repeat(ATTRIBUTE_NAME_MAX_LENGTH + 1),
      slug: `Invalid-${"x".repeat(ATTRIBUTE_SLUG_MAX_LENGTH)}`,
      unit: "x".repeat(ATTRIBUTE_UNIT_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        name: expect.any(Array),
        slug: expect.any(Array),
        unit: expect.any(Array),
      });
    }
  });
});

describe("createAttributeSlug", () => {
  it("creates a lowercase accent-free slug", () => {
    expect(createAttributeSlug("  Resolución Óptica 4K ")).toBe(
      "resolucion-optica-4k",
    );
  });
});
