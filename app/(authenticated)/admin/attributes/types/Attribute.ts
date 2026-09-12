import type { components } from "@/lib/api/generated";
import type { z } from "zod";

import type { attributeFormSchema } from "../_lib/AttributeFormSchema";

type GeneratedAttribute = components["schemas"]["AttributeResponseDto"];

export type Attribute = Omit<GeneratedAttribute, "unit"> & {
  unit: string | null;
};

export type AttributeDataType = Attribute["dataType"];

export type AttributeEditable = Pick<
  Attribute,
  "dataType" | "id" | "name" | "slug" | "unit"
>;

export type AttributeFormValues = z.infer<typeof attributeFormSchema>;

export type AttributeFormProps =
  | { attribute?: never; mode: "create" }
  | { attribute: AttributeEditable; mode: "edit" };

export type AttributeFieldErrors = Partial<
  Record<keyof AttributeFormValues, string[]>
>;

export type AttributeMutationResult =
  | { success: true }
  | {
      fieldErrors?: AttributeFieldErrors;
      message: string;
      success: false;
    };
