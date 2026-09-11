import { z } from "zod";

export const CATEGORY_NAME_MAX_LENGTH = 100;
export const CATEGORY_SLUG_MAX_LENGTH = 120;

const categorySlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categoryFormSchema = z.object({
  description: z.string().trim(),
  name: z
    .string()
    .trim()
    .min(1, "Introduce el nombre de la categoría.")
    .max(
      CATEGORY_NAME_MAX_LENGTH,
      `El nombre no puede superar los ${CATEGORY_NAME_MAX_LENGTH} caracteres.`,
    ),
  parentId: z
    .string()
    .uuid("Selecciona una categoría padre válida.")
    .nullable(),
  slug: z
    .string()
    .trim()
    .min(1, "Introduce el slug de la categoría.")
    .max(
      CATEGORY_SLUG_MAX_LENGTH,
      `El slug no puede superar los ${CATEGORY_SLUG_MAX_LENGTH} caracteres.`,
    )
    .regex(
      categorySlugPattern,
      "Usa sólo letras minúsculas, números y guiones entre palabras.",
    ),
});

export function createCategorySlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, CATEGORY_SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}
