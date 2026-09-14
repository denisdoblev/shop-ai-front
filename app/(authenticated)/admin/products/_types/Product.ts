import type { components } from "@/lib/api/generated";
import type { z } from "zod";

import type { productFormSchema } from "../_lib/ProductFormSchema";

type GeneratedProduct = components["schemas"]["ProductResponseDto"];

export type Product = Omit<GeneratedProduct, "description" | "model"> & {
  description: string | null;
  model: string | null;
};

export type ProductListItem = Product & {
  brandName: string;
  categoryName: string;
};

export type ProductOption = { id: string; name: string };
export type ProductAttribute = {
  dataType: "boolean" | "number" | "string";
  id: string;
  name: string;
  slug: string;
  unit: string | null;
};
export type ProductSpecificationValue = string | number | boolean | null;
export type ProductSpecifications = Record<string, ProductSpecificationValue>;
export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductFieldErrors = Partial<Record<keyof ProductFormValues, string[]>>;
export type ProductMutationResult =
  | { success: true }
  | {
      fieldErrors?: ProductFieldErrors;
      message: string;
      productId?: string;
      productSaved?: boolean;
      specificationErrors?: Record<string, string>;
      success: false;
    };
