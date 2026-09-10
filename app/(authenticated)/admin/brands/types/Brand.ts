import type { components } from "@/lib/api/generated";
import type { z } from "zod";

import type { brandFormSchema } from "../_lib/BrandFormSchema";

export type Brand = components["schemas"]["BrandResponseDto"];

export type BrandEditable = Pick<Brand, "id" | "name" | "slug">;

export type BrandFormValues = z.infer<typeof brandFormSchema>;

export type BrandFormProps =
  | { brand?: never; mode: "create" }
  | { brand: BrandEditable; mode: "edit" };

export type BrandFieldErrors = Partial<
  Record<keyof BrandFormValues, string[]>
>;

export type BrandMutationResult =
  | { success: true }
  | {
      fieldErrors?: BrandFieldErrors;
      message: string;
      success: false;
    };
