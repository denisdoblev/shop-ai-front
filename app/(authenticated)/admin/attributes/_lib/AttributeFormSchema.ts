import { z } from "zod";

export const ATTRIBUTE_NAME_MAX_LENGTH = 150;
export const ATTRIBUTE_SLUG_MAX_LENGTH = 160;
export const ATTRIBUTE_UNIT_MAX_LENGTH = 50;

const attributeSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const attributeFormSchema = z.object({
  dataType: z.enum(["string", "number", "boolean"], {
    error: "Selecciona el tipo de dato.",
  }),
  name: z
    .string()
    .trim()
    .min(1, "Introduce el nombre del atributo.")
    .max(
      ATTRIBUTE_NAME_MAX_LENGTH,
      `El nombre no puede superar los ${ATTRIBUTE_NAME_MAX_LENGTH} caracteres.`,
    ),
  slug: z
    .string()
    .trim()
    .min(1, "Introduce el slug del atributo.")
    .max(
      ATTRIBUTE_SLUG_MAX_LENGTH,
      `El slug no puede superar los ${ATTRIBUTE_SLUG_MAX_LENGTH} caracteres.`,
    )
    .regex(
      attributeSlugPattern,
      "Usa sólo letras minúsculas, números y guiones entre palabras.",
    ),
  unit: z
    .string()
    .trim()
    .max(
      ATTRIBUTE_UNIT_MAX_LENGTH,
      `La unidad no puede superar los ${ATTRIBUTE_UNIT_MAX_LENGTH} caracteres.`,
    ),
});

export function createAttributeSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, ATTRIBUTE_SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}
