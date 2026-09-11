import type { components } from "@/lib/api/generated";
import type { z } from "zod";

import type { categoryFormSchema } from "../_lib/CategoryFormSchema";

type GeneratedCategory = components["schemas"]["CategoryResponseDto"];

export type Category = Omit<
  GeneratedCategory,
  "description" | "parentId"
> & {
  description: string | null;
  parentId: string | null;
};

export type CategoryEditable = Pick<
  Category,
  "description" | "id" | "name" | "parentId" | "slug"
>;

export type CategoryOption = Pick<Category, "id" | "name" | "parentId">;

export type CategoryListItem = Category & {
  parentName: string | null;
};

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export type CategoryFormProps =
  | {
      category?: never;
      mode: "create";
      parentCategories: CategoryOption[];
    }
  | {
      category: CategoryEditable;
      mode: "edit";
      parentCategories: CategoryOption[];
    };

export type CategoryFieldErrors = Partial<
  Record<keyof CategoryFormValues, string[]>
>;

export type CategoryMutationResult =
  | { success: true }
  | {
      fieldErrors?: CategoryFieldErrors;
      message: string;
      success: false;
    };
