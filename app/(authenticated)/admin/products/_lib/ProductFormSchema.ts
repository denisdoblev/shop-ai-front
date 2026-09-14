import { z } from "zod";

export const PRODUCT_NAME_MAX_LENGTH = 200;
export const PRODUCT_SLUG_MAX_LENGTH = 220;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const productFormSchema = z.object({
  brandId: z.string().uuid("Selecciona una marca válida."),
  categoryId: z.string().uuid("Selecciona una categoría válida."),
  description: z.string().trim(),
  model: z.string().trim().max(150, "El modelo no puede superar 150 caracteres."),
  name: z.string().trim().min(1, "Introduce el nombre del producto.").max(PRODUCT_NAME_MAX_LENGTH),
  slug: z.string().trim().min(1, "Introduce el slug del producto.").max(PRODUCT_SLUG_MAX_LENGTH).regex(slugPattern, "Usa letras minúsculas, números y guiones."),
  specifications: z.record(z.string().uuid(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
});

export function createProductSlug(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, PRODUCT_SLUG_MAX_LENGTH).replace(/-+$/g, "");
}

