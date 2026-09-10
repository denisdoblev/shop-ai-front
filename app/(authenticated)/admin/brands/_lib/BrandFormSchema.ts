import { z } from "zod";

export const BRAND_NAME_MAX_LENGTH = 100;
export const BRAND_SLUG_MAX_LENGTH = 120;

const brandSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const brandFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Introduce el nombre de la marca.")
    .max(
      BRAND_NAME_MAX_LENGTH,
      `El nombre no puede superar los ${BRAND_NAME_MAX_LENGTH} caracteres.`,
    ),
  slug: z
    .string()
    .trim()
    .min(1, "Introduce el slug de la marca.")
    .max(
      BRAND_SLUG_MAX_LENGTH,
      `El slug no puede superar los ${BRAND_SLUG_MAX_LENGTH} caracteres.`,
    )
    .regex(
      brandSlugPattern,
      "Usa sólo letras minúsculas, números y guiones entre palabras.",
    ),
});

export function createBrandSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, BRAND_SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}
